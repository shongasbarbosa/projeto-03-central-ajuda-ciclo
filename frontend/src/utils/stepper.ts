/**
 * Regra de navegação do stepper de abertura de chamado: apenas a etapa
 * imediatamente anterior à atual pode ser reaberta pelo cabeçalho. Etapas
 * futuras nunca são clicáveis — avançar é feito somente pelo botão
 * "Continuar", que já valida os dados da etapa atual.
 */
export function isStepClickable(currentStep: number, targetStep: number): boolean {
  return targetStep === currentStep - 1;
}
