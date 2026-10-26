/** Formatação para tela. Sem import de servidor: serve para cliente e servidor. */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function reais(centavos: number): string {
  return BRL.format(centavos / 100)
}

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

export function dataHora(iso: string): string {
  return DATA_HORA.format(new Date(iso)).replace('.', '')
}

export function dataExtenso(iso: string): string {
  return DATA.format(new Date(iso))
}

/** "Victor Rodrigues" → "Victor" */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}
