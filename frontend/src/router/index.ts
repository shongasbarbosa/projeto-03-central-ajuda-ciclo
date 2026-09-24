import { createRouter, createWebHashHistory } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      redirect: () => ({ name: "home" }),
    },
    {
      path: "/inicio",
      name: "home",
      component: () => import("@/views/HomeRedirectView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/tickets",
      name: "student-tickets",
      component: () => import("@/views/student/MyTicketsView.vue"),
      meta: { requiresAuth: true, role: "aluno" },
    },
    {
      path: "/tickets/novo",
      name: "student-ticket-new",
      component: () => import("@/views/student/NewTicketView.vue"),
      meta: { requiresAuth: true, role: "aluno" },
    },
    {
      path: "/tickets/:id",
      name: "ticket-detail",
      component: () => import("@/views/TicketDetailView.vue"),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { requiresAuth: true },
    },
    {
      path: "/faq",
      name: "student-faq",
      component: () => import("@/views/student/FaqView.vue"),
      meta: { requiresAuth: true, role: "aluno" },
    },
    {
      path: "/atendente/fila",
      name: "agent-queue",
      component: () => import("@/views/agent/TicketQueueView.vue"),
      meta: { requiresAuth: true, role: "atendente" },
    },
    {
      path: "/atendente/faq",
      name: "agent-faq",
      component: () => import("@/views/agent/FaqManageView.vue"),
      meta: { requiresAuth: true, role: "atendente" },
    },
    {
      path: "/atendente/relatorios",
      name: "agent-reports",
      component: () => import("@/views/agent/ReportsView.vue"),
      meta: { requiresAuth: true, role: "atendente" },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: () => ({ name: "home" }),
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.ready) {
    await auth.restoreSession();
  }

  if (to.meta.public) {
    return true;
  }

  if (!auth.isAuthenticated) {
    return { name: "login" };
  }

  const requiredRole = to.meta.role as "aluno" | "atendente" | undefined;
  if (requiredRole && auth.user?.role !== requiredRole) {
    return { name: "home" };
  }

  return true;
});

export default router;
