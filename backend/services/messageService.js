const supabase = require('../utils/supabase');

// 获取用户的会话列表（包含最后一条消息、未读数、对方用户信息）
async function getConversations(userId) {
  // 先查出用户参与的所有会话ID
  const { data: participants, error: partError } = await supabase
    .from('participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId);
  if (partError) throw partError;
  if (!participants.length) return [];

  const conversationIds = participants.map(p => p.conversation_id);
  
  // 获取每个会话的详细信息（包括对方用户信息）
  const { data: convos, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      updated_at,
      participants!inner (
        user_id,
        user:users(id, username, avatar_url)
      )
    `)
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });
  if (convError) throw convError;

  // 为每个会话获取最后一条消息和未读数
  const result = [];
  for (const convo of convos) {
    // 找出对方用户（排除自己）
    const other = convo.participants.find(p => p.user_id !== userId)?.user;
    if (!other) continue; // 私聊至少应有两人

    // 获取最后一条消息（使用 maybeSingle 避免无消息时报错）
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at, type, sender_id')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();  // 修复点：使用 maybeSingle 而不是 single

    // 计算未读数：该会话中，发送时间大于用户最后阅读时间的消息数量（且不是自己发的）
    const participant = participants.find(p => p.conversation_id === convo.id);
    const lastReadAt = participant.last_read_at || '1970-01-01';
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convo.id)
      .neq('sender_id', userId)
      .gt('created_at', lastReadAt);

    result.push({
      conversation_id: convo.id,
      other_user: other,
      last_message: lastMsg || null,
      unread_count: count || 0,
      updated_at: convo.updated_at,
    });
  }
  return result;
}

// 获取某个会话的历史消息（分页，按时间正序返回）
async function getMessages(conversationId, userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  // 转换为正序返回（前端按时间顺序显示）
  return { list: data.reverse(), total: count };
}

// 发送消息（如果私聊会话不存在，自动创建）
async function sendMessage(senderId, receiverId, content, type = 'text', metadata = null) {
  // 检查是否被拉黑
  const { count } = await supabase
    .from('blacklist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', receiverId)
    .eq('blocked_id', senderId);
  if (count > 0) {
    throw new Error('对方已将你拉黑，无法发送消息');
  }
  // 查找两人是否有私聊会话
  let conversationId = null;
  const { data: existing } = await supabase
    .from('participants')
    .select('conversation_id')
    .eq('user_id', senderId);
  if (existing && existing.length) {
    const senderConvos = existing.map(p => p.conversation_id);
    const { data: receiverPart } = await supabase
      .from('participants')
      .select('conversation_id')
      .eq('user_id', receiverId)
      .in('conversation_id', senderConvos);
    if (receiverPart && receiverPart.length) {
      conversationId = receiverPart[0].conversation_id;
    }
  }

  if (!conversationId) {
    // 创建新会话
    const { data: newConvo, error: convoError } = await supabase
      .from('conversations')
      .insert([{ type: 'private' }])
      .select()
      .single();
    if (convoError) throw convoError;
    conversationId = newConvo.id;

    // 添加两个参与者
    const participants = [
      { conversation_id: conversationId, user_id: senderId },
      { conversation_id: conversationId, user_id: receiverId },
    ];
    const { error: partError } = await supabase
      .from('participants')
      .insert(participants);
    if (partError) throw partError;
  }

  // 插入消息
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type,
      metadata,
    }])
    .select()
    .single();
  if (msgError) throw msgError;

  // 更新会话的 updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date() })
    .eq('id', conversationId);

  return message;
}

// 标记会话为已读（更新 participants 的 last_read_at）
async function markAsRead(conversationId, userId) {
  const { error } = await supabase
    .from('participants')
    .update({ last_read_at: new Date() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
};