'use client'

import { ShieldCheck, Store, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { Campo, CampoSenha } from '@/components/ui/campo'
import { Segmentado } from '@/components/ui/segmentado'
import { cadastrar, entrar, entrarDemo } from '@/lib/cliente/api'

type Modo = 'entrar' | 'cadastrar'
type Erros = { nome?: string; email?: string; senha?: string }
type Pendente = null | 'formulario' | 'demo-cliente' | 'demo-loja'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const TEXTOS: Record<Modo, { titulo: string; subtitulo: string; botao: string; carregando: string }> = {
  entrar: {
    titulo: 'Entre na sua conta',
    subtitulo: 'Veja suas análises anteriores ou comece uma nova.',
    botao: 'Entrar',
    carregando: 'Entrando',
  },
  cadastrar: {
    titulo: 'Crie sua conta',
    subtitulo: 'Com a conta, suas análises ficam guardadas para você comparar depois.',
    botao: 'Criar minha conta',
    carregando: 'Criando sua conta',
  },
}

export function FormularioEntrar({ demo }: { demo: boolean }) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [pendente, setPendente] = useState<Pendente>(null)

  const refNome = useRef<HTMLInputElement>(null)
  const refEmail = useRef<HTMLInputElement>(null)
  const refSenha = useRef<HTMLInputElement>(null)

  const ocupado = pendente !== null
  const textos = TEXTOS[modo]

  function trocarModo(novo: Modo) {
    setModo(novo)
    setErros({})
    setErroGeral(null)
  }

  function validar(): Erros {
    const e: Erros = {}
    if (modo === 'cadastrar' && nome.trim().length < 2) e.nome = 'Escreva seu nome.'
    if (!email) e.email = 'Escreva seu e-mail.'
    else if (!EMAIL_VALIDO.test(email)) e.email = 'Esse e-mail não parece certo. Confira e tente de novo.'
    if (modo === 'cadastrar') {
      if (senha.length < 8) e.senha = 'Use pelo menos 8 caracteres.'
    } else if (!senha) {
      e.senha = 'Escreva sua senha.'
    }
    return e
  }

  /** Depois do ok do servidor: segue para o destino e deixa o botão em "carregando" até a página trocar. */
  function seguir(destino?: string) {
    router.replace(destino ?? '/')
    router.refresh()
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (ocupado) return
    const encontrados = validar()
    setErros(encontrados)
    setErroGeral(null)
    if (encontrados.nome || encontrados.email || encontrados.senha) {
      const alvo = encontrados.nome ? refNome : encontrados.email ? refEmail : refSenha
      alvo.current?.focus()
      return
    }
    setPendente('formulario')
    const r = modo === 'entrar' ? await entrar(email, senha) : await cadastrar(nome.trim(), email, senha)
    if (!r.ok) {
      setErroGeral(r.erro)
      setPendente(null)
      return
    }
    seguir(r.destino)
  }

  async function entrarComoDemo(perfil: 'cliente' | 'loja') {
    if (ocupado) return
    setErros({})
    setErroGeral(null)
    setPendente(perfil === 'cliente' ? 'demo-cliente' : 'demo-loja')
    const r = await entrarDemo(perfil)
    if (!r.ok) {
      setErroGeral(r.erro)
      setPendente(null)
      return
    }
    seguir(r.destino)
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <Segmentado
        rotuloAcessivel="Entrar ou criar conta"
        valor={modo}
        aoMudar={trocarModo}
        itens={[
          { valor: 'entrar', rotulo: 'Entrar' },
          { valor: 'cadastrar', rotulo: 'Criar conta' },
        ]}
      />

      <h2 className="mt-7 text-[28px] leading-[1.05] font-bold sm:text-[32px]">{textos.titulo}</h2>
      <p className="mt-2 text-[16px] leading-snug text-tinta-suave sm:text-[17px]">{textos.subtitulo}</p>

      <form onSubmit={enviar} noValidate className="mt-6 grid gap-4">
        {modo === 'cadastrar' ? (
          <Campo
            ref={refNome}
            rotulo="Nome"
            name="nome"
            autoComplete="name"
            autoCapitalize="words"
            obrigatorio
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              if (erros.nome) setErros((x) => ({ ...x, nome: undefined }))
            }}
            erro={erros.nome}
            disabled={ocupado}
          />
        ) : null}

        <Campo
          ref={refEmail}
          rotulo="E-mail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          obrigatorio
          value={email}
          onChange={(e) => {
            setEmail(e.target.value.toLowerCase().replace(/\s/g, ''))
            if (erros.email) setErros((x) => ({ ...x, email: undefined }))
          }}
          erro={erros.email}
          disabled={ocupado}
        />

        <CampoSenha
          ref={refSenha}
          rotulo="Senha"
          name="senha"
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          obrigatorio
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value)
            if (erros.senha) setErros((x) => ({ ...x, senha: undefined }))
          }}
          dica={modo === 'cadastrar' ? 'Use pelo menos 8 caracteres.' : undefined}
          erro={erros.senha}
          disabled={ocupado}
        />

        {erroGeral ? <Alerta variante="erro">{erroGeral}</Alerta> : null}

        <Botao
          type="submit"
          tamanho="lg"
          cheio
          carregando={pendente === 'formulario'}
          disabled={ocupado}
          className="mt-1"
        >
          {pendente === 'formulario' ? `${textos.carregando}…` : textos.botao}
        </Botao>
      </form>

      {demo ? (
        <div className="mt-9 border-t border-linha pt-7">
          <p className="text-[15px] font-semibold text-tinta">Atalhos de demonstração</p>
          <p className="mt-1 text-[15px] leading-snug text-tinta-suave">
            Entre direto com uma conta de teste, sem preencher nada.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Botao
              variante="secundario"
              cheio
              icone={<UserRound className="size-5" aria-hidden />}
              carregando={pendente === 'demo-cliente'}
              disabled={ocupado}
              onClick={() => entrarComoDemo('cliente')}
            >
              Entrar como cliente
            </Botao>
            <Botao
              variante="secundario"
              cheio
              icone={<Store className="size-5" aria-hidden />}
              carregando={pendente === 'demo-loja'}
              disabled={ocupado}
              onClick={() => entrarComoDemo('loja')}
            >
              Entrar como loja
            </Botao>
          </div>
        </div>
      ) : null}

      <p className="mt-9 flex items-start gap-2.5 text-[14px] leading-snug text-tinta-suave">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-petroleo" aria-hidden />
        <span>
          A Smart Derma orienta a escolha de cosméticos e não substitui a consulta com um dermatologista. Sua foto é
          usada só na análise e apagada assim que o resultado sai.
        </span>
      </p>
    </div>
  )
}
