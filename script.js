// Atividade 2 - Estados e cidades com a API do IBGE
// Aluno(a): Daniel Cardoso

const selectEstado = document.getElementById('estado')
const selectCidade = document.getElementById('cidade')
const qtdCidades = document.getElementById('qtdCidades')
const filtroCidade = document.getElementById('filtroCidade')
const mensagem = document.getElementById('mensagem')
const resumo = document.getElementById('resumo')

const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'

// Guarda a lista completa de cidades do estado para o filtro (desafio extra)
let cidadesDoEstado = []

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

// Preenche o select de cidades com a lista recebida (usado no carregamento e no filtro)
function preencherCidades(cidades) {
    selectCidade.innerHTML = cidades.length > 0
        ? '<option value="">Selecione a cidade</option>'
        : '<option value="">Nenhuma cidade encontrada</option>'

    cidades.forEach(cidade => {
        const option = document.createElement('option')
        option.value = cidade.nome
        option.textContent = cidade.nome
        selectCidade.appendChild(option)
    })
}

// 2) Carregar as cidades quando o estado mudar
selectEstado.addEventListener('change', () => {
    const uf = selectEstado.value
    resumo.innerHTML = ''
    mensagem.textContent = ''
    filtroCidade.value = ''
    cidadesDoEstado = []

    if (uf === '') {
        selectCidade.innerHTML = '<option value="">Escolha um estado primeiro</option>'
        selectCidade.disabled = true
        filtroCidade.disabled = true
        qtdCidades.textContent = ''
        return
    }

    // TODO 2: mostrar "Carregando..." e desabilitar o select de cidades
    selectCidade.innerHTML = '<option value="">Carregando...</option>'
    selectCidade.disabled = true
    filtroCidade.disabled = true
    qtdCidades.textContent = ''

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        .then(resposta => {
            if (!resposta.ok) throw new Error('Erro ao buscar as cidades')
            return resposta.json()
        })
        .then(cidades => {
            cidadesDoEstado = cidades

            // TODO 3: preencher o select de cidades (texto = cidade.nome)
            preencherCidades(cidades)

            // TODO 4: habilitar o select novamente
            selectCidade.disabled = false
            filtroCidade.disabled = false

            // TODO 5: quantas cidades o estado tem
            const nomeEstado = selectEstado.options[selectEstado.selectedIndex].text
            qtdCidades.innerHTML = `📍 <strong>${nomeEstado}</strong> tem <strong>${cidades.length}</strong> cidades`
        })
        .catch(erro => {
            console.log(erro)
            selectCidade.innerHTML = '<option value="">Erro ao carregar</option>'
            mostrarErro('Não foi possível carregar as cidades. Tente escolher o estado novamente.')
        })
})

// Desafio extra: filtrar a lista de cidades enquanto o usuario digita
filtroCidade.addEventListener('input', () => {
    // normalize + replace remove os acentos, assim "sao" encontra "São Paulo"
    const semAcento = texto => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const busca = semAcento(filtroCidade.value.trim())
    const selecionada = selectCidade.value

    const filtradas = cidadesDoEstado.filter(cidade => semAcento(cidade.nome).includes(busca))
    preencherCidades(filtradas)

    // Mantém a cidade escolhida se ela ainda estiver na lista filtrada
    selectCidade.value = selecionada
    // Se sobrou só uma cidade, já deixa ela selecionada
    if (filtradas.length === 1) selectCidade.value = filtradas[0].nome
})

// 3) Enviar o formulario
document.getElementById('formInscricao').addEventListener('submit', (evento) => {
    evento.preventDefault() // impede a pagina de recarregar

    const nome = document.getElementById('nome')
    const email = document.getElementById('email')

    // Marca em vermelho os campos que não foram preenchidos corretamente
    let valido = true
    ;[nome, email, selectEstado, selectCidade].forEach(campo => {
        const erro = campo.value.trim() === '' || !campo.checkValidity()
        campo.classList.toggle('invalido', erro)
        if (erro) valido = false
    })

    if (!valido) {
        resumo.innerHTML = ''
        mostrarErro('Preencha nome, e-mail válido, estado e cidade.')
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
