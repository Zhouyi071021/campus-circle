import { createRouter, createWebHistory } from 'vue-router';
import PostDetail from '@/views/PostDetail.vue';
import Profile from '@/views/Profile.vue';

// 公共页面
const Home = () => import('@/views/Home.vue');
const Auth = () => import('@/views/Auth.vue');
const Search = () => import('@/views/Search.vue');
const Sponsor = () => import('@/views/Sponsor.vue');
const TagDetail = () => import('@/views/TagDetail.vue');
const SchoolDetail = () => import('@/views/SchoolDetail.vue');
const ListView = () => import('@/views/ListView.vue');

const PostCreate = () => import('@/views/PostCreate.vue');

// 社区相关
const Communities = () => import('@/views/Communities.vue');
const CreateCommunity = () => import('@/views/CreateCommunity.vue');

// 商家相关
const Business = () => import('@/views/Business.vue');
const BusinessCreate = () => import('@/views/BusinessCreate.vue');

// 消息相关
const Messages = () => import('@/views/Messages.vue');
const Chat = () => import('@/views/Chat.vue');

// 个人中心
const Following = () => import('@/views/profile/Following.vue');
const Followers = () => import('@/views/profile/Followers.vue');
const EditProfile = () => import('@/views/profile/EditProfile.vue');
const Collections = () => import('@/views/profile/Collections.vue');
const MyComments = () => import('@/views/profile/Comments.vue');
const MyPosts = () => import('@/views/profile/MyPosts.vue');

// 设置
const Settings = () => import('@/views/Settings.vue');
const BindPhone = () => import('@/views/settings/BindPhone.vue');
const BindEmail = () => import('@/views/settings/BindEmail.vue');
const ChangePassword = () => import('@/views/settings/ChangePassword.vue');
const Blacklist = () => import('@/views/settings/Blacklist.vue');
const LoginHistory = () => import('@/views/settings/LoginHistory.vue');
const DeleteAccount = () => import('@/views/DeleteAccount.vue');

// 建议箱
const Suggestions = () => import('@/views/Suggestions.vue');
const SuggestionDetail = () => import('@/views/SuggestionDetail.vue');

// 管理员
const AdminLayout = () => import('@/layouts/AdminLayout.vue');
const AdminDashboard = () => import('@/views/admin/Dashboard.vue');
const AdminPosts = () => import('@/views/admin/Posts.vue');
const AdminComments = () => import('@/views/admin/Comments.vue');
const AdminUsers = () => import('@/views/admin/Users.vue');
const AdminBusiness = () => import('@/views/admin/Business.vue');
const AdminCommunities = () => import('@/views/admin/Communities.vue');
const AdminSchools = () => import('@/views/admin/Schools.vue');
const AdminLogs = () => import('@/views/admin/Logs.vue');
const AdminDistricts = () => import('@/views/admin/Districts.vue');
const AdminAds = () => import('@/views/admin/Ads.vue');
const AdminMusic = () => import('@/views/admin/Music.vue');
const AdminAgreements = () => import('@/views/admin/Agreements.vue');
// 如果有新页面，可在此添加

const routes = [
  // 公共页面
  { path: '/', name: 'Home', component: Home },
  { path: '/auth', name: 'Auth', component: Auth },
  { path: '/search', name: 'Search', component: Search },
  { path: '/sponsor', name: 'Sponsor', component: Sponsor },
  { path: '/tag/:tag', name: 'TagDetail', component: TagDetail },
  { path: '/school/:id', name: 'SchoolDetail', component: SchoolDetail },
  { path: '/list', name: 'ListView', component: ListView },

  // 帖子
  { path: '/post/:id', name: 'PostDetail', component: PostDetail },
  { path: '/post/create', name: 'PostCreate', component: PostCreate, meta: { requiresAuth: true } },

  // 社区
  { path: '/communities', name: 'Communities', component: Communities },
  { path: '/communities/create', name: 'CreateCommunity', component: CreateCommunity, meta: { requiresAuth: true } },
  {
    path: '/communities/:id',
    name: 'CommunityDetail',
    component: () => import('@/views/CommunityDetail.vue'),
  },

  // 商家
  { path: '/business', name: 'Business', component: Business },
  { path: '/business/create', name: 'BusinessCreate', component: BusinessCreate, meta: { requiresAuth: true, requiresBusiness: true } },
  {
    path: '/business/:id',
    name: 'BusinessDetail',
    component: () => import('@/views/BusinessDetail.vue'),
  },

  // 消息
  { path: '/messages', name: 'Messages', component: Messages, meta: { requiresAuth: true } },
  { path: '/messages/:conversationId', name: 'Chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/messages/new', name: 'NewChat', component: () => import('@/views/NewChat.vue'), meta: { requiresAuth: true } },

  // 个人中心子页面
  { path: '/profile/following', name: 'Following', component: Following, meta: { requiresAuth: true } },
  { path: '/profile/followers', name: 'Followers', component: Followers, meta: { requiresAuth: true } },
  { path: '/profile/edit', name: 'EditProfile', component: EditProfile, meta: { requiresAuth: true } },
  { path: '/profile/collections', name: 'Collections', component: Collections, meta: { requiresAuth: true } },
  { path: '/profile/posts', name: 'MyPosts', component: MyPosts, meta: { requiresAuth: true } },

  // 动态路由：他人主页
  { path: '/profile/:id', name: 'Profile', component: Profile, meta: { requiresAuth: true } },

  // 自己主页
  { path: '/profile', name: 'ProfileSelf', component: Profile, meta: { requiresAuth: true } },

  // 设置
  { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
  { path: '/settings/bind-phone', name: 'BindPhone', component: BindPhone, meta: { requiresAuth: true } },
  { path: '/settings/bind-email', name: 'BindEmail', component: BindEmail, meta: { requiresAuth: true } },
  { path: '/settings/change-password', name: 'ChangePassword', component: ChangePassword, meta: { requiresAuth: true } },
  { path: '/settings/blacklist', name: 'Blacklist', component: Blacklist, meta: { requiresAuth: true } },
  { path: '/settings/login-history', name: 'LoginHistory', component: LoginHistory, meta: { requiresAuth: true } },
  { path: '/settings/delete-account', name: 'DeleteAccount', component: DeleteAccount, meta: { requiresAuth: true } },

  // 建议箱
  { path: '/suggestions', name: 'Suggestions', component: Suggestions, meta: { requiresAuth: true } },
  { path: '/suggestions/:id', name: 'SuggestionDetail', component: SuggestionDetail, meta: { requiresAuth: true } },

  // 管理员后台
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAdmin: true } },
      { path: 'posts', name: 'AdminPosts', component: AdminPosts, meta: { requiresAdmin: true } },
      { path: 'comments', name: 'AdminComments', component: AdminComments, meta: { requiresAdmin: true } },
      { path: 'users', name: 'AdminUsers', component: AdminUsers, meta: { requiresAdmin: true } },
      { path: 'business', name: 'AdminBusiness', component: AdminBusiness, meta: { requiresAdmin: true } },
      { path: 'communities', name: 'AdminCommunities', component: AdminCommunities, meta: { requiresAdmin: true } },
      { path: 'schools', name: 'AdminSchools', component: AdminSchools, meta: { requiresAdmin: true } },
      { path: 'districts', name: 'AdminDistricts', component: AdminDistricts, meta: { requiresAdmin: true } },
      { path: 'ads', name: 'AdminAds', component: AdminAds, meta: { requiresAdmin: true } },
      { path: 'music', name: 'AdminMusic', component: AdminMusic, meta: { requiresAdmin: true } },
      { path: 'agreements', name: 'AdminAgreements', component: AdminAgreements, meta: { requiresAdmin: true } },
      { path: 'logs', name: 'AdminLogs', component: AdminLogs, meta: { requiresSuperAdmin: true } },
      { path: 'suggestions', name: 'AdminSuggestions', component: () => import('@/views/admin/Suggestions.vue'), meta: { requiresAdmin: true } },
      { path: 'admins', name: 'AdminAdmins', component: () => import('@/views/admin/Admins.vue'), meta: { requiresSuperAdmin: true } },
      { path: 'applications', name: 'AdminBusinessApplications', component: () => import('@/views/admin/BusinessApplications.vue'), meta: { requiresAdmin: true } },
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 白名单
const whiteList = ['/auth', '/'];

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('解析用户信息失败', e);
    }
  }

  // 已登录
  if (token && user) {
    if (to.path === '/auth') {
      next('/');
      return;
    }

    // 角色权限检查
    if (to.meta.requiresAdmin && !['admin', 'super_admin'].includes(user.role)) {
      next('/');
      return;
    }
    if (to.meta.requiresSuperAdmin && user.role !== 'super_admin') {
      next('/');
      return;
    }
    if (to.meta.requiresBusiness && user.role !== 'business') {
      next('/');
      return;
    }

    next();
    return;
  }

  // 未登录
  if (whiteList.includes(to.path) || !to.meta.requiresAuth) {
    next();
  } else {
    next('/auth');
  }
});

export default router;