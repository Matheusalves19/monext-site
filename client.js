document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // 🔐 SESSÃO
  // ===============================
  let sessao = {};
  try {
    sessao = JSON.parse(localStorage.getItem("usuarioLogado")) || {};
  } catch (e) {
    sessao = {};
  }

  if (!sessao.id && !sessao.nome) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

  const usuario = sessao.nome;
  const senhaUsuario = sessao.senha;
  const idCaixa = parseInt(sessao.idCaixa || "0");

  // ===============================
  // 🔗 CAIXA
  // ===============================
  let saldoCaixa = parseFloat(localStorage.getItem("saldoCaixa") || "0");
  let caixaAberto = localStorage.getItem("caixaAberto") === "true";

  function atualizarSaldo() {
    const saldoSpan = document.getElementById("saldo-caixa");
    if (saldoSpan) {
      saldoSpan.textContent = saldoCaixa.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    }
    localStorage.setItem("saldoCaixa", saldoCaixa.toFixed(2));
  }

  atualizarSaldo();

  // ===============================
  // 📦 CLIENTES
  // ===============================
  let clientes = JSON.parse(localStorage.getItem("clientes") || "[]");

  const senhaAdmin = "admin";

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf[10]);
  }

  function formatarCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  // Calcula dívida do cliente
function calcularDivida(cliente) {
  let total = 0;
  if (cliente.emprestimos) {
    cliente.emprestimos.forEach(emp => {
      emp.parcelas.forEach(p => {
        if (!p.pago) total += p.valor;
      });
    });
  }
  cliente.divida = total;
  return total;
}
  // ===============================
  // 🧾 RENDERIZAÇÃO
  // ===============================
  function renderizarClientes(filtro = "") {
    const tabela = document.getElementById("tabelaClientes");
    if (!tabela) return;

    tabela.innerHTML = "";

    clientes
      .filter(c =>
        c.caixaId === idCaixa &&
        (
          c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
          c.cpf.includes(filtro.replace(/\D/g, ""))
        )
      )
      .forEach(c => {
        calcularDivida(c);
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.nome}</td>
          <td>${formatarCPF(c.cpf)}</td>
          <td>R$ ${c.divida.toFixed(2)}</td>
          <td>
            <button class="btn btn-success btn-sm btn-novo" data-id="${c.id}">Novo</button>
            <button class="btn btn-primary btn-sm btn-editar" data-id="${c.id}">Editar</button>
            <button class="btn btn-danger btn-sm btn-excluir" data-id="${c.id}">Excluir</button>
            <button class="btn btn-info btn-sm btn-detalhes" data-id="${c.id}">Detalhes</button>
          </td>
          <td>${c.dataUltimaAlteracao || "—"}</td>
        `;
        tabela.appendChild(tr);
      });
  }

  renderizarClientes();

  // ===============================
  // 🔗 MODAIS
  // ===============================
  const modalEmprestimoEl = document.getElementById("modalEmprestimo");
  const modalEmprestimo = new bootstrap.Modal(modalEmprestimoEl);

  const modalDetalhesEl = document.getElementById("modalDetalhes");
  const modalDetalhes = new bootstrap.Modal(modalDetalhesEl);

  // ===============================
  // ➕ ADICIONAR CLIENTE
  // ===============================
  const btnAdicionar = document.getElementById("btnAdicionarCliente");
  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      // Abrir modal de empréstimo vazio para criar cliente
      const nome = prompt("Nome do cliente:");
      if (!nome) return;

      const cpf = prompt("CPF (somente números):");
      if (!cpf || !validarCPF(cpf)) {
        alert("CPF inválido!");
        return;
      }

      if (clientes.some(c => c.cpf === cpf && c.caixaId === idCaixa)) {
        alert("Cliente já existe neste caixa!");
        return;
      }

      clientes.push({
        id: Date.now(),
        nome,
        cpf,
        caixaId: idCaixa,
        divida: 0,
        emprestimos: [],
        dataUltimaAlteracao: new Date().toLocaleString("pt-BR")
      });

      localStorage.setItem("clientes", JSON.stringify(clientes));
      renderizarClientes();
      alert("Cliente adicionado com sucesso!");
    });
  }

  // ===============================
  // 🔁 EVENTOS DA TABELA
  // ===============================
  document.getElementById("tabelaClientes")?.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const cliente = clientes.find(c => c.id === id);

    if (btn.classList.contains("btn-excluir")) {
      const senha = prompt("Senha admin:");
      if (senha === senhaAdmin) {
        clientes = clientes.filter(c => c.id !== id);
        localStorage.setItem("clientes", JSON.stringify(clientes));
        renderizarClientes();
      } else {
        alert("Senha incorreta!");
      }
    }

    if (btn.classList.contains("btn-novo")) {
      // Abrir modal de empréstimo para este cliente
      document.getElementById("clienteIdEmprestimo").value = cliente.id;
      document.getElementById("valorEmprestimo").value = "";
      document.getElementById("jurosEmprestimo").value = "";
      document.getElementById("parcelasEmprestimo").value = "1";
      modalEmprestimo.show();
    }

    if (btn.classList.contains("btn-editar")) {
      const novoNome = prompt("Alterar nome do cliente:", cliente.nome);
      if (!novoNome) return;

      const novoCPF = prompt("Alterar CPF (somente números):", cliente.cpf);
      if (!novoCPF || !validarCPF(novoCPF)) {
        alert("CPF inválido!");
        return;
      }

      cliente.nome = novoNome;
      cliente.cpf = novoCPF;
      cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");
      localStorage.setItem("clientes", JSON.stringify(clientes));
      renderizarClientes();
    }

    if (btn.classList.contains("btn-detalhes")) {
      const detalhesBody = document.getElementById("detalhesBody");
      let html = `<p><strong>Nome:</strong> ${cliente.nome}</p>`;
      html += `<p><strong>CPF:</strong> ${formatarCPF(cliente.cpf)}</p>`;
      html += `<p><strong>Dívida:</strong> R$ ${cliente.divida.toFixed(2)}</p>`;

      if (cliente.emprestimos?.length > 0) {
        html += `<h6>Empréstimos:</h6><ul>`;
        cliente.emprestimos.forEach(emp => {
          html += `<li>Valor: R$ ${emp.valor}, Parcelas: ${emp.parcelas.length}</li>`;
        });
        html += `</ul>`;
      }

      detalhesBody.innerHTML = html;
      modalDetalhes.show();
    }
  });

  // ===============================
  // 🔍 PESQUISA
  // ===============================
  document.getElementById("pesquisa-cliente")?.addEventListener("input", e => {
    renderizarClientes(e.target.value);
  });

  // ===============================
  // 🔙 VOLTAR
  // ===============================
  document.getElementById("btnVoltar")?.addEventListener("click", () => {
    window.location.href = "painel.html";
  });

  // ===============================
  // 🚪 LOGOUT
  // ===============================
  document.getElementById("btnLogout")?.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("caixaAberto");
    window.location.href = "index.html";
  });

  // ===============================
  // 💾 SALVAR EMPRÉSTIMO
  // ===============================
  document.getElementById("btnSalvarEmprestimo")?.addEventListener("click", () => {
    const idCliente = parseInt(document.getElementById("clienteIdEmprestimo").value);
    const cliente = clientes.find(c => c.id === idCliente);
    if (!cliente) return;

    const valor = parseFloat(document.getElementById("valorEmprestimo").value);
    const juros = parseFloat(document.getElementById("jurosEmprestimo").value);
    const parcelas = parseInt(document.getElementById("parcelasEmprestimo").value);

    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor válido!");
      return;
    }

    // Cria parcelas
    const parcelasArray = [];
    for (let i = 0; i < parcelas; i++) {
      parcelasArray.push({ valor: valor / parcelas, pago: false });
    }

    cliente.emprestimos.push({
      valor,
      juros,
      parcelas: parcelasArray
    });

    cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");
    localStorage.setItem("clientes", JSON.stringify(clientes));
    renderizarClientes();

    modalEmprestimo.hide();
    alert("Empréstimo adicionado com sucesso!");
  });

});

