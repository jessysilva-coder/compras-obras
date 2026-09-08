const telaLogin = document.getElementById("tela-login");
const app = document.getElementById("app");
const formLogin = document.getElementById("form-login");
const botaoLogin = document.getElementById("botao-login");
const loginErro = document.getElementById("login-erro");
const menuLateral = document.getElementById("menu-lateral");
const usuarioNome = document.getElementById("usuario-nome");
const usuarioPerfil = document.getElementById("usuario-perfil");
const tituloPagina = document.getElementById("titulo-pagina");
const paginaInicio = document.getElementById("pagina-inicio");
const paginaGenerica = document.getElementById("pagina-generica");
const textoPaginaGenerica = document.getElementById("texto-pagina-generica");

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

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  loginErro.hidden = true;
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
    localStorage.setItem("token", resultado.token);
    localStorage.setItem("nome", resultado.nome);
    localStorage.setItem("perfil", resultado.perfil);
    await entrarNoApp();
  } catch (erro) {
    mostrarErroLogin("Não foi possível conectar ao sistema. Verifique sua internet e tente novamente.");
  } finally {
    botaoLogin.disabled = false;
    botaoLogin.textContent = "Entrar";
  }
});

document.getElementById("botao-sair").addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  localStorage.clear();
  try { await chamarApi({ action: "logout", token }); } catch (e) {}
  app.hidden = true;
  telaLogin.hidden = false;
});

function selecionarPagina(nomePagina) {
  tituloPagina.textContent = nomePagina;
  document.querySelectorAll(".item-menu").forEach((el) => {
    el.classList.toggle("ativo", el.textContent === nomePagina);
  });

  if (nomePagina === "Início") {
    paginaInicio.hidden = false;
    paginaGenerica.hidden = true;
  } else {
    paginaInicio.hidden = true;
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

async function entrarNoApp() {
  const token = localStorage.getItem("token");
  const resultado = await chamarApi({ action: "getMenu", token });

  if (!resultado.ok) {
    localStorage.clear();
    telaLogin.hidden = false;
    app.hidden = true;
    mostrarErroLogin("Sua sessão expirou. Faça login novamente.");
    return;
  }

  usuarioNome.textContent = resultado.nome;
  usuarioPerfil.textContent = resultado.perfil;
  montarMenu(resultado.menu);

  telaLogin.hidden = true;
  app.hidden = false;
}

// Ao carregar a página, tenta reaproveitar uma sessão já existente.
(function iniciar() {
  if (APP_URL.indexOf("COLE_AQUI") !== -1) {
    mostrarErroLogin("Configuração pendente: cole a URL do Apps Script em config.js.");
    return;
  }
  const token = localStorage.getItem("token");
  if (token) {
    entrarNoApp();
  }
})();
