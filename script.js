// O token de sessão fica só nesta variável, em memória.
// Ele NUNCA é salvo em localStorage/sessionStorage/cookie de propósito:
// assim, todo carregamento (ou recarregamento) da página exige login de novo.
let sessaoToken = null;

const telaLogin = document.getElementById("tela-login");
const app = document.getElementById("app");
const formLogin = document.getElementById("form-login");
const botaoLogin = document.getElementById("botao-login");
const loginErro = document.getElementById("login-erro");
const loginSucesso = document.getElementById("login-sucesso");
const botaoVerSenha = document.getElementById("botao-ver-senha");
const campoSenha = document.getElementById("campo-senha");

botaoVerSenha.addEventListener("click", () => {
  const vaiMostrar = campoSenha.type === "password";
  campoSenha.type = vaiMostrar ? "text" : "password";
  botaoVerSenha.textContent = vaiMostrar ? "🙈" : "👁";
  botaoVerSenha.classList.toggle("ativo", vaiMostrar);
  botaoVerSenha.setAttribute("aria-pressed", String(vaiMostrar));
  botaoVerSenha.setAttribute("aria-label", vaiMostrar ? "Ocultar senha" : "Mostrar senha");
});
const menuLateral = document.getElementById("menu-lateral");
const usuarioNome = document.getElementById("usuario-nome");
const usuarioPerfil = document.getElementById("usuario-perfil");
const tituloPagina = document.getElementById("titulo-pagina");
const paginaInicio = document.getElementById("pagina-inicio");
const paginaGenerica = document.getElementById("pagina-generica");
const textoPaginaGenerica = document.getElementById("texto-pagina-generica");
const paginaConfiguracoes = document.getElementById("pagina-configuracoes");
const tabelaUsuariosCorpo = document.getElementById("tabela-usuarios-corpo");
const formUsuario = document.getElementById("form-usuario");
const formUsuarioTitulo = document.getElementById("form-usuario-titulo");
const botaoNovoUsuario = document.getElementById("botao-novo-usuario");
const botaoCancelarUsuario = document.getElementById("botao-cancelar-usuario");
const usuarioFormErro = document.getElementById("usuario-form-erro");
let idUsuarioEmEdicao = null;

const paginaProjetos = document.getElementById("pagina-projetos");
const tabelaProjetosCorpo = document.getElementById("tabela-projetos-corpo");
const formProjeto = document.getElementById("form-projeto");
const formProjetoTitulo = document.getElementById("form-projeto-titulo");
const botaoNovoProjeto = document.getElementById("botao-novo-projeto");
const botaoCancelarProjeto = document.getElementById("botao-cancelar-projeto");
const projetoFormErro = document.getElementById("projeto-form-erro");
const selectEngenheiro = document.getElementById("prj-engenheiro");
const selectResponsavelCompras = document.getElementById("prj-responsavel-compras");
let idProjetoEmEdicao = null;
let usuariosParaSelecaoCarregados = false;

async function chamarApi(payload) {
  const resposta = await fetch(APP_URL, {
    method: "POST",
    // text/plain evita o preflight de CORS no Apps Script.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  return resposta.json();
}

function mostrarErroLogin(mensagem) {
  loginErro.textContent = mensagem;
  loginErro.hidden = false;
}

function voltarParaLogin() {
  sessaoToken = null;
  app.hidden = true;
  telaLogin.hidden = false;
  formLogin.reset();
}

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  loginErro.hidden = true;
  loginSucesso.hidden = true;
  botaoLogin.disabled = true;
  botaoLogin.textContent = "Entrando...";

  const login = document.getElementById("campo-login").value.trim();
  const senha = document.getElementById("campo-senha").value;

  try {
    const resultado = await chamarApi({ action: "login", login, senha });
    if (!resultado.ok) {
      mostrarErroLogin(resultado.erro || "Não foi possível entrar.");
      return;
    }

    sessaoToken = resultado.token;
    usuarioNome.textContent = resultado.nome;
    usuarioPerfil.textContent = resultado.perfil;
    await carregarMenu();

    loginSucesso.hidden = false;
    await new Promise((resolve) => setTimeout(resolve, 900));

    telaLogin.hidden = true;
    app.hidden = false;
    loginSucesso.hidden = true;
  } catch (erro) {
    mostrarErroLogin("Não foi possível conectar ao sistema. Verifique sua internet e tente novamente.");
  } finally {
    botaoLogin.disabled = false;
    botaoLogin.textContent = "Entrar";
  }
});

document.getElementById("botao-sair").addEventListener("click", async () => {
  try { await chamarApi({ action: "logout", token: sessaoToken }); } catch (e) {}
  voltarParaLogin();
});

function selecionarPagina(nomePagina) {
  tituloPagina.textContent = nomePagina;
  document.querySelectorAll(".item-menu").forEach((el) => {
    el.classList.toggle("ativo", el.textContent === nomePagina);
  });

  paginaInicio.hidden = true;
  paginaGenerica.hidden = true;
  paginaConfiguracoes.hidden = true;
  paginaProjetos.hidden = true;

  if (nomePagina === "Início") {
    paginaInicio.hidden = false;
  } else if (nomePagina === "Configurações") {
    paginaConfiguracoes.hidden = false;
    carregarUsuarios();
  } else if (nomePagina === "Projetos") {
    paginaProjetos.hidden = false;
    carregarProjetos();
  } else {
    paginaGenerica.hidden = false;
    textoPaginaGenerica.textContent = `A página "${nomePagina}" será construída em uma das próximas etapas.`;
  }
}

function montarMenu(itensMenu) {
  menuLateral.innerHTML = "";
  itensMenu.forEach((item) => {
    const el = document.createElement("div");
    el.className = "item-menu";
    el.textContent = item;
    el.addEventListener("click", () => selecionarPagina(item));
    menuLateral.appendChild(el);
  });
  selecionarPagina("Início");
}

async function carregarMenu() {
  const resultado = await chamarApi({ action: "getMenu", token: sessaoToken });
  if (!resultado.ok) {
    mostrarErroLogin("Sua sessão expirou. Faça login novamente.");
    voltarParaLogin();
    return;
  }
  montarMenu(resultado.menu);
}

if (APP_URL.indexOf("COLE_AQUI") !== -1) {
  mostrarErroLogin("Configuração pendente: cole a URL do Apps Script em config.js.");
}

// ---------- Configurações > Cadastro de Usuários ----------

function abrirFormUsuario(usuario) {
  usuarioFormErro.hidden = true;
  if (usuario) {
    idUsuarioEmEdicao = usuario.idUsuario;
    formUsuarioTitulo.textContent = `Editar usuário — ${usuario.nome}`;
    document.getElementById("usr-nome").value = usuario.nome;
    document.getElementById("usr-login").value = usuario.login;
    document.getElementById("usr-perfil").value = usuario.perfil;
    document.getElementById("usr-senha").value = "";
  } else {
    idUsuarioEmEdicao = null;
    formUsuarioTitulo.textContent = "Novo usuário";
    formUsuario.reset();
  }
  formUsuario.hidden = false;
}

botaoNovoUsuario.addEventListener("click", () => abrirFormUsuario(null));
botaoCancelarUsuario.addEventListener("click", () => { formUsuario.hidden = true; });

formUsuario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  usuarioFormErro.hidden = true;

  const dados = {
    nome: document.getElementById("usr-nome").value.trim(),
    login: document.getElementById("usr-login").value.trim(),
    senha: document.getElementById("usr-senha").value,
    perfil: document.getElementById("usr-perfil").value
  };

  try {
    let resultado;
    if (idUsuarioEmEdicao) {
      resultado = await chamarApi({ action: "atualizarUsuario", token: sessaoToken, dados: { ...dados, idUsuario: idUsuarioEmEdicao } });
    } else {
      resultado = await chamarApi({ action: "criarUsuario", token: sessaoToken, dados });
    }

    if (!resultado.ok) {
      usuarioFormErro.textContent = resultado.erro;
      usuarioFormErro.hidden = false;
      return;
    }

    formUsuario.hidden = true;
    carregarUsuarios();
  } catch (erro) {
    usuarioFormErro.textContent = "Não foi possível salvar. Tente novamente.";
    usuarioFormErro.hidden = false;
  }
});

async function alternarSituacao(usuario) {
  const novaSituacao = usuario.situacao === "Ativo" ? "Inativo" : "Ativo";
  const confirmacao = confirm(`Confirma alterar "${usuario.nome}" para ${novaSituacao}?`);
  if (!confirmacao) return;

  const resultado = await chamarApi({
    action: "alterarSituacaoUsuario",
    token: sessaoToken,
    dados: { idUsuario: usuario.idUsuario, novaSituacao }
  });

  if (!resultado.ok) {
    alert(resultado.erro);
    return;
  }
  carregarUsuarios();
}

async function carregarUsuarios() {
  tabelaUsuariosCorpo.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;

  const resultado = await chamarApi({ action: "listarUsuarios", token: sessaoToken });
  if (!resultado.ok) {
    tabelaUsuariosCorpo.innerHTML = `<tr><td colspan="5">${resultado.erro}</td></tr>`;
    return;
  }

  tabelaUsuariosCorpo.innerHTML = "";
  resultado.usuarios.forEach((usuario) => {
    const linha = document.createElement("tr");

    const classeBadge = usuario.situacao === "Ativo" ? "ativo" : "inativo";
    const textoAlternar = usuario.situacao === "Ativo" ? "Desativar" : "Ativar";

    linha.innerHTML = `
      <td>${usuario.nome}</td>
      <td>${usuario.login}</td>
      <td>${usuario.perfil}</td>
      <td><span class="badge-situacao ${classeBadge}">${usuario.situacao}</span></td>
      <td>
        <div class="acoes-tabela">
          <button class="link-acao" data-acao="editar">Editar</button>
          <button class="link-acao perigo" data-acao="alternar">${textoAlternar}</button>
        </div>
      </td>
    `;

    linha.querySelector('[data-acao="editar"]').addEventListener("click", () => abrirFormUsuario(usuario));
    linha.querySelector('[data-acao="alternar"]').addEventListener("click", () => alternarSituacao(usuario));

    tabelaUsuariosCorpo.appendChild(linha);
  });
}

// ---------- Projetos ----------

function brParaIso(dataBR) {
  if (!dataBR) return "";
  const partes = dataBR.split("/");
  if (partes.length !== 3) return "";
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function isoParaBr(dataIso) {
  if (!dataIso) return "";
  const partes = dataIso.split("-");
  if (partes.length !== 3) return "";
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

async function garantirListaUsuarios() {
  if (usuariosParaSelecaoCarregados) return;

  const resultado = await chamarApi({ action: "obterUsuariosParaSelecao", token: sessaoToken });
  if (!resultado.ok) return;

  [selectEngenheiro, selectResponsavelCompras].forEach((select) => {
    resultado.usuarios.forEach((usuario) => {
      const opcao = document.createElement("option");
      opcao.value = usuario.idUsuario;
      opcao.textContent = usuario.nome;
      select.appendChild(opcao);
    });
  });
  usuariosParaSelecaoCarregados = true;
}

async function abrirFormProjeto(projeto) {
  projetoFormErro.hidden = true;
  await garantirListaUsuarios();

  if (projeto) {
    idProjetoEmEdicao = projeto.idProjeto;
    formProjetoTitulo.textContent = `Editar projeto — ${projeto.nome}`;
    document.getElementById("prj-nome").value = projeto.nome || "";
    document.getElementById("prj-codigo").value = projeto.codigoInterno || "";
    document.getElementById("prj-cliente").value = projeto.cliente || "";
    document.getElementById("prj-endereco").value = projeto.endereco || "";
    selectEngenheiro.value = projeto.engenheiro || "";
    selectResponsavelCompras.value = projeto.responsavelCompras || "";
    document.getElementById("prj-data-inicio").value = brParaIso(projeto.dataInicio);
    document.getElementById("prj-previsao-termino").value = brParaIso(projeto.previsaoTermino);
    document.getElementById("prj-orcamento").value = projeto.orcamentoTotal || "";
    document.getElementById("prj-status").value = projeto.status || "Em andamento";
    document.getElementById("prj-observacoes").value = projeto.observacoes || "";
  } else {
    idProjetoEmEdicao = null;
    formProjetoTitulo.textContent = "Novo projeto";
    formProjeto.reset();
  }
  formProjeto.hidden = false;
}

botaoNovoProjeto.addEventListener("click", () => abrirFormProjeto(null));
botaoCancelarProjeto.addEventListener("click", () => { formProjeto.hidden = true; });

formProjeto.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  projetoFormErro.hidden = true;

  const dados = {
    nome: document.getElementById("prj-nome").value.trim(),
    codigoInterno: document.getElementById("prj-codigo").value.trim(),
    cliente: document.getElementById("prj-cliente").value.trim(),
    endereco: document.getElementById("prj-endereco").value.trim(),
    engenheiro: selectEngenheiro.value,
    responsavelCompras: selectResponsavelCompras.value,
    dataInicio: isoParaBr(document.getElementById("prj-data-inicio").value),
    previsaoTermino: isoParaBr(document.getElementById("prj-previsao-termino").value),
    orcamentoTotal: document.getElementById("prj-orcamento").value,
    status: document.getElementById("prj-status").value,
    observacoes: document.getElementById("prj-observacoes").value.trim()
  };

  try {
    let resultado;
    if (idProjetoEmEdicao) {
      resultado = await chamarApi({ action: "atualizarProjeto", token: sessaoToken, dados: { ...dados, idProjeto: idProjetoEmEdicao } });
    } else {
      resultado = await chamarApi({ action: "criarProjeto", token: sessaoToken, dados });
    }

    if (!resultado.ok) {
      projetoFormErro.textContent = resultado.erro;
      projetoFormErro.hidden = false;
      return;
    }

    formProjeto.hidden = true;
    carregarProjetos();
  } catch (erro) {
    projetoFormErro.textContent = "Não foi possível salvar. Tente novamente.";
    projetoFormErro.hidden = false;
  }
});

function formatarMoeda(valor) {
  const numero = Number(valor);
  if (!valor || isNaN(numero)) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function carregarProjetos() {
  tabelaProjetosCorpo.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

  const resultado = await chamarApi({ action: "listarProjetos", token: sessaoToken });
  if (!resultado.ok) {
    tabelaProjetosCorpo.innerHTML = `<tr><td colspan="6">${resultado.erro}</td></tr>`;
    return;
  }

  if (resultado.projetos.length === 0) {
    tabelaProjetosCorpo.innerHTML = `<tr><td colspan="6">Nenhum projeto cadastrado ainda.</td></tr>`;
    return;
  }

  tabelaProjetosCorpo.innerHTML = "";
  resultado.projetos.forEach((projeto) => {
    const linha = document.createElement("tr");
    const classeBadge = projeto.status === "Em andamento" ? "ativo" : "inativo";

    linha.innerHTML = `
      <td>${projeto.nome}</td>
      <td>${projeto.cliente || "—"}</td>
      <td>${projeto.responsavelComprasNome || "—"}</td>
      <td>${formatarMoeda(projeto.orcamentoTotal)}</td>
      <td><span class="badge-situacao ${classeBadge}">${projeto.status}</span></td>
      <td><button class="link-acao" data-acao="editar">Editar</button></td>
    `;

    linha.querySelector('[data-acao="editar"]').addEventListener("click", () => abrirFormProjeto(projeto));
    tabelaProjetosCorpo.appendChild(linha);
  });
}
