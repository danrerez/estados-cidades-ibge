// Atividade 2 - Estados e cidades com a API do IBGE
// Aluno(a): Daniel Cardoso

const selectEstado = document.getElementById('estado')
const selectCidade = document.getElementById('cidade')
const qtdCidades = document.getElementById('qtdCidades')
const buscaCidade = document.getElementById('buscaCidade')
const listaCidades = document.getElementById('listaCidades')
const comboCidade = document.getElementById('comboCidade')
const mensagem = document.getElementById('mensagem')
const resumo = document.getElementById('resumo')

const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'

// Guarda a lista completa de cidades do estado para o filtro (desafio extra)
let cidadesDoEstado = []
let cidadesVisiveis = []
let indiceAtivo = -1

// normalize + replace remove os acentos, assim "sao" encontra "São Paulo"
const semAcento = texto => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function mostrarErro(texto) {
    mensagem.className = 'erro'
    mensagem.textContent = texto
}

// 1) Carregar os estados ao abrir a pagina
function carregarEstados() {
    fetch(URL_ESTADOS)
        .then(resposta => {
            if (!resposta.ok) throw new Error('Erro ao buscar os estados')
            return resposta.json()
        })
        .then(estados => {
            console.log(estados)
            selectEstado.innerHTML = '<option value="">Selecione o estado</option>'

            // TODO 1: um <option> para cada estado (value = sigla, texto = nome)
            estados.forEach(estado => {
                const option = document.createElement('option')
                option.value = estado.sigla
                option.textContent = estado.nome
                selectEstado.appendChild(option)
            })
        })
        .catch(erro => {
            console.log(erro)
            selectEstado.innerHTML = '<option value="">Erro ao carregar</option>'
            mostrarErro('Não foi possível carregar os estados. Verifique sua conexão e recarregue a página.')
        })
}

// Coloca o campo de cidade em um estado (carregando, desabilitado ou liberado)
function prepararCampoCidade(textoOpcao, placeholder, desabilitado) {
    selectCidade.innerHTML = `<option value="">${textoOpcao}</option>`
    selectCidade.disabled = desabilitado
    buscaCidade.value = ''
    buscaCidade.placeholder = placeholder
    buscaCidade.disabled = desabilitado
    fecharLista()
}

// 2) Carregar as cidades quando o estado mudar
selectEstado.addEventListener('change', () => {
    const uf = selectEstado.value
    resumo.innerHTML = ''
    mensagem.textContent = ''
    qtdCidades.textContent = ''
    cidadesDoEstado = []

    if (uf === '') {
        prepararCampoCidade('Escolha um estado primeiro', 'Escolha um estado primeiro', true)
        return
    }

    // TODO 2: mostrar "Carregando..." e desabilitar o campo de cidades
    prepararCampoCidade('Carregando...', 'Carregando...', true)

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        .then(resposta => {
            if (!resposta.ok) throw new Error('Erro ao buscar as cidades')
            return resposta.json()
        })
        .then(cidades => {
            cidadesDoEstado = cidades

            // TODO 3: preencher o select de cidades (texto = cidade.nome)
            prepararCampoCidade('Selecione a cidade', 'Digite ou selecione a cidade', false)
            cidades.forEach(cidade => {
                const option = document.createElement('option')
                option.value = cidade.nome
                option.textContent = cidade.nome
                selectCidade.appendChild(option)
            })

            // TODO 4: habilitar o campo novamente (feito em prepararCampoCidade)

            // TODO 5: quantas cidades o estado tem
            const nomeEstado = selectEstado.options[selectEstado.selectedIndex].text
            qtdCidades.innerHTML = `📍 <strong>${nomeEstado}</strong> tem <strong>${cidades.length}</strong> cidades`
        })
        .catch(erro => {
            console.log(erro)
            prepararCampoCidade('Erro ao carregar', 'Erro ao carregar', true)
            mostrarErro('Não foi possível carregar as cidades. Tente escolher o estado novamente.')
        })
})

// ===== Desafio extra: campo único para digitar ou selecionar a cidade =====

function abrirLista() {
    if (buscaCidade.disabled) return
    renderizarLista()
    comboCidade.classList.add('aberto')
    buscaCidade.setAttribute('aria-expanded', 'true')
}

function fecharLista() {
    comboCidade.classList.remove('aberto')
    buscaCidade.setAttribute('aria-expanded', 'false')
    indiceAtivo = -1
}

// Monta a lista com as cidades que combinam com o que foi digitado
function renderizarLista() {
    const busca = semAcento(buscaCidade.value.trim())
    cidadesVisiveis = cidadesDoEstado.filter(cidade => semAcento(cidade.nome).includes(busca))
    listaCidades.innerHTML = ''

    if (cidadesVisiveis.length === 0) {
        listaCidades.innerHTML = '<li class="vazio">Nenhuma cidade encontrada</li>'
        return
    }

    cidadesVisiveis.forEach((cidade, indice) => {
        const item = document.createElement('li')
        item.textContent = cidade.nome
        item.setAttribute('role', 'option')
        if (cidade.nome === selectCidade.value) item.classList.add('selecionada')
        if (indice === indiceAtivo) item.classList.add('ativa')

        // mousedown em vez de click para escolher antes do campo perder o foco
        item.addEventListener('mousedown', evento => {
            evento.preventDefault()
            escolherCidade(cidade.nome)
        })
        listaCidades.appendChild(item)
    })
}

function escolherCidade(nome) {
    selectCidade.value = nome
    buscaCidade.value = nome
    buscaCidade.classList.remove('invalido')
    fecharLista()
}

// Destaca a cidade navegada pelas setas do teclado
function moverDestaque(passo) {
    if (cidadesVisiveis.length === 0) return
    indiceAtivo = (indiceAtivo + passo + cidadesVisiveis.length) % cidadesVisiveis.length
    renderizarLista()
    listaCidades.children[indiceAtivo].scrollIntoView({ block: 'nearest' })
}

buscaCidade.addEventListener('focus', abrirLista)
buscaCidade.addEventListener('click', abrirLista)

buscaCidade.addEventListener('input', () => {
    // Ao digitar, a cidade só fica escolhida quando o texto bate com uma cidade da lista
    const exata = cidadesDoEstado.find(cidade => semAcento(cidade.nome) === semAcento(buscaCidade.value.trim()))
    selectCidade.value = exata ? exata.nome : ''
    indiceAtivo = -1
    abrirLista()
})

buscaCidade.addEventListener('keydown', evento => {
    if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        if (!comboCidade.classList.contains('aberto')) abrirLista()
        moverDestaque(1)
    } else if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        moverDestaque(-1)
    } else if (evento.key === 'Enter' && comboCidade.classList.contains('aberto')) {
        // Enter escolhe a cidade destacada (ou a única que sobrou) em vez de enviar o formulário
        const escolhida = cidadesVisiveis[indiceAtivo] || (cidadesVisiveis.length === 1 ? cidadesVisiveis[0] : null)
        if (escolhida) {
            evento.preventDefault()
            escolherCidade(escolhida.nome)
        }
    } else if (evento.key === 'Escape') {
        fecharLista()
    }
})

// Ao sair do campo, mostra o nome exato da cidade escolhida (ex.: "aruja" vira "Arujá")
buscaCidade.addEventListener('blur', () => {
    if (selectCidade.value) buscaCidade.value = selectCidade.value
    fecharLista()
})

// 3) Enviar o formulario
document.getElementById('formInscricao').addEventListener('submit', (evento) => {
    evento.preventDefault() // impede a pagina de recarregar

    const nome = document.getElementById('nome')
    const email = document.getElementById('email')

    // Marca em vermelho os campos que não foram preenchidos corretamente
    let valido = true
    ;[nome, email, selectEstado].forEach(campo => {
        const erro = campo.value.trim() === '' || !campo.checkValidity()
        campo.classList.toggle('invalido', erro)
        if (erro) valido = false
    })

    const semCidade = selectCidade.value === ''
    buscaCidade.classList.toggle('invalido', semCidade)
    if (semCidade) valido = false

    if (!valido) {
        resumo.innerHTML = ''
        mostrarErro('Preencha nome, e-mail válido, estado e escolha uma cidade da lista.')
        return
    }

    mensagem.textContent = ''

    // TODO 6: "Fulano, de Campinas/SP, inscrito com sucesso"
    resumo.innerHTML = `
        <span class="resumo-icone">✅</span>
        <div>
            <strong>${nome.value.trim()}, de ${selectCidade.value}/${selectEstado.value}, inscrito com sucesso!</strong>
            <span>Enviaremos a confirmação para ${email.value.trim()}</span>
        </div>`
})

// Tira o destaque de erro assim que o campo é corrigido
document.querySelectorAll('#formInscricao input, #formInscricao select').forEach(campo => {
    campo.addEventListener('input', () => campo.classList.remove('invalido'))
})

carregarEstados()
