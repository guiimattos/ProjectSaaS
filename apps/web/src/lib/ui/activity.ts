const MAP: Record<string, string> = {
  "organization.created": "criou a organização",
  "organization.updated": "atualizou a organização",
  "project.created": "criou um projeto",
  "project.updated": "atualizou um projeto",
  "project.deleted": "excluiu um projeto",
  "task.created": "criou uma tarefa",
  "task.updated": "atualizou uma tarefa",
  "task.deleted": "excluiu uma tarefa",
  "comment.created": "comentou em uma tarefa",
  "invitation.created": "enviou um convite",
  "invitation.accepted": "entrou na organização",
  "invitation.revoked": "revogou um convite",
  "member.role_changed": "alterou o papel de um membro",
  "member.removed": "removeu um membro",
  "member.left": "saiu da organização",
  "subscription.synced": "sincronizou a assinatura",
  "integration.updated": "configurou uma integração",
  "integration.removed": "removeu uma integração",
};

export const describeActivity = (action: string) => MAP[action] ?? action.replace(".", " ");
