<template>
  <div class="donate-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>赞助我们</h3>
      <div class="qrcodes">
        <div class="qrcode-item">
          <img src="/images/wechat-qr.png" alt="微信收款码" />
          <p>微信</p>
        </div>
        <div class="qrcode-item">
          <img src="/images/alipay-qr.png" alt="支付宝收款码" />
          <p>支付宝</p>
        </div>
      </div>
      <p class="thank-you">您的支持让我们更有动力！</p>
      <button @click="$emit('close')" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close']);
</script>

<style scoped>
.donate-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}
.qrcodes {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}
.qrcode-item img {
  width: 120px;
  height: 120px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px;
}
.thank-you {
  color: #6c757d;
  margin: 16px 0;
}
.close-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
}
</style>