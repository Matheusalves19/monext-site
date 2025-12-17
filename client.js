// Recupera dados da sessão
const sessao = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
const usuario = sessao.nome;
const senhaUsuario = sessao.senha;
const idCaixa = parseInt(localStorage.getItem("idCaixa") || sessao.idCaixa || "0");

// 🔗 Integração com o caixa
let saldoCaixa = parseFloat(localStorage.getItem("saldoCaixa") || "0");
let caixaAberto = localStorage.getItem("caixaAberto") === "true";

// Validação de sessão
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


// Recupera clientes
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

// Senha de admin
const senhaAdmin = "admin";

// Função para validar CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

// Formata CPF
function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
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

// Atualiza saldo na tela e no localStorage
function atualizarSaldo() {
  const saldoSpan = document.getElementById("saldo-caixa");
  if (saldoSpan) saldoSpan.textContent = saldoCaixa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  localStorage.setItem("saldoCaixa", saldoCaixa.toFixed(2));
}

atualizarSaldo();

// Renderiza clientes
function renderizarClientes(filtro = "") {
  const tabela = document.getElementById("tabelaClientes");
  tabela.innerHTML = "";

  const filtrados = clientes.filter(c =>
    c.caixaId === idCaixa &&
    (c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      c.id.toString().includes(filtro) ||
      c.cpf.includes(filtro.replace(/\D/g, "")))
  );

  filtrados.forEach(c => {
    calcularDivida(c);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nome}</td>
      <td>${formatarCPF(c.cpf)}</td>
      <td>R$ ${c.divida.toFixed(2)}</td>
      <td>
        <div class="acoes-container d-flex gap-1">
          <button class="btn btn-success btn-sm btn-novo" data-id="${c.id}">
            <i class="bi bi-plus-circle"></i> Novo
          </button>
          <button class="btn btn-primary btn-sm btn-editar" data-id="${c.id}">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm btn-excluir" data-id="${c.id}">
            <i class="bi bi-trash"></i> Excluir
          </button>
          <button class="btn btn-info btn-sm btn-detalhes" data-id="${c.id}">
            <i class="bi bi-info-circle"></i> Detalhes
          </button>
        </div>
      </td>
      <td>${c.dataUltimaAlteracao || "—"}</td>
    `;

    tabela.appendChild(tr);
  });
}

// Abrir modal de empréstimo
function abrirModalEmprestimo(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  document.getElementById("clienteIdEmprestimo").value = id;
  document.getElementById("valorEmprestimo").value = "";
  document.getElementById("jurosEmprestimo").value = "";
  document.getElementById("parcelasEmprestimo").value = 1;
  document.getElementById("vencimento1").value = "";
  document.getElementById("vencimento2").value = "";
  document.getElementById("vencimento3").value = "";
  document.getElementById("vencimento4").value = "";
  document.getElementById("senhaEmprestimo").value = "";
  document.getElementById("vencimento4-container").style.display = "none";

  const modalEl = document.getElementById("modalEmprestimo");
  new bootstrap.Modal(modalEl).show();

  // Corrige backdrop travado
  modalEl.addEventListener('hidden.bs.modal', () => {
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  });
}

// Controle do campo vencimento 4
document.getElementById("parcelasEmprestimo").addEventListener("change", () => {
  const parcelas = parseInt(document.getElementById("parcelasEmprestimo").value);
  const campo4Container = document.getElementById("vencimento4-container");

  if (parcelas <= 3) {
    campo4Container.style.display = "none";
  } else {
    const senha = prompt("Mais de 3 parcelas requer senha do administrador:");
    if (senha !== senhaAdmin) {
      alert("Senha incorreta. Limite de 3 parcelas.");
      document.getElementById("parcelasEmprestimo").value = 3;
      campo4Container.style.display = "none";
      return;
    }
    campo4Container.style.display = "block";
  }
});

// Salvar empréstimo
document.getElementById("btnSalvarEmprestimo").addEventListener("click", () => {
  const id = parseInt(document.getElementById("clienteIdEmprestimo").value);
  const valor = parseFloat(document.getElementById("valorEmprestimo").value);
  const juros = parseFloat(document.getElementById("jurosEmprestimo").value);
  const parcelas = parseInt(document.getElementById("parcelasEmprestimo").value);
  const vencimentos = [
    document.getElementById("vencimento1").value,
    document.getElementById("vencimento2").value,
    document.getElementById("vencimento3").value,
    document.getElementById("vencimento4").value
  ].slice(0, parcelas);
  const senha = document.getElementById("senhaEmprestimo").value;

  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  if (isNaN(valor) || valor <= 0) { alert("Valor inválido!"); return; }
  if (isNaN(juros) || juros < 0) { alert("Juros inválido!"); return; }
  if (isNaN(parcelas) || parcelas < 1) { alert("Número de parcelas inválido!"); return; }
  if (vencimentos.some(v => !v)) { alert("Todos os vencimentos devem ser preenchidos!"); return; }
  if (senha !== senhaUsuario) { alert("Senha incorreta!"); return; }

  const totalComJuros = valor + (valor * juros / 100);
  const valorParcela = parseFloat((totalComJuros / parcelas).toFixed(2));

  const emprestimo = {
    id: Date.now(),
    valorOriginal: valor,
    juros: juros,
    totalComJuros: totalComJuros,
    parcelas: [],
    dataEmprestimo: new Date().toLocaleString("pt-BR")
  };

  for (let i = 0; i < parcelas; i++) {
    emprestimo.parcelas.push({
      numero: i + 1,
      valor: valorParcela,
      vencimento: vencimentos[i],
      pago: false
    });
  }

  cliente.emprestimos = cliente.emprestimos || [];
  cliente.emprestimos.push(emprestimo);
  calcularDivida(cliente);
  cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");
  localStorage.setItem("clientes", JSON.stringify(clientes));

  // 🔽 Subtrai valor original do saldo atual (desconsiderando juros)
  saldoCaixa -= valor;
  atualizarSaldo();

  renderizarClientes();
  const modalEl = document.getElementById("modalEmprestimo");
  bootstrap.Modal.getInstance(modalEl).hide();
  alert(`Empréstimo registrado. Dívida atual: R$ ${cliente.divida.toFixed(2)}`);
});

// Abrir modal detalhes
function abrirDetalhes(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const container = document.getElementById("detalhesBody");
  container.innerHTML = `<h5>${cliente.nome} - CPF: ${formatarCPF(cliente.cpf)}</h5>`;

  if (!cliente.emprestimos || cliente.emprestimos.length === 0) {
    container.innerHTML += "<p>Sem empréstimos.</p>";
  } else {
    cliente.emprestimos.forEach(emp => {
      let empHTML = `<div class="mb-3 border p-2">
        <strong>Empréstimo:</strong> R$ ${emp.valorOriginal.toFixed(2)} | Juros: ${emp.juros}% | Total: R$ ${emp.totalComJuros.toFixed(2)}<br>
        <strong>Data:</strong> ${emp.dataEmprestimo}<br>
        <strong>Parcelas:</strong>
        <table class="table table-sm mt-2">
          <thead><tr><th>#</th><th>Valor R$</th><th>Vencimento</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
      `;

      emp.parcelas.forEach(p => {
        const vencimento = new Date(p.vencimento);
        const hoje = new Date();
        const linhaClass = vencimento < hoje && !p.pago ? 'table-danger' : '';

        empHTML += `<tr class="${linhaClass}" data-cliente-id="${cliente.id}" data-emprestimo-id="${emp.id}" data-parcela-num="${p.numero}">
          <td>${p.numero}</td>
          <td>${p.valor.toFixed(2)}</td>
          <td>${p.vencimento}</td>
          <td>${p.pago ? "Pago" : "Em aberto"}</td>
          <td>${p.pago ? "" : `<button class="btn btn-success btn-sm btn-pagar-parcela">Pagar</button>`}</td>
        </tr>`;
      });

      empHTML += "</tbody></table></div>";
      container.innerHTML += empHTML;
    });
  }

  // Event delegation para os botões "Pagar"
  container.querySelectorAll(".btn-pagar-parcela").forEach(btn => {
    btn.addEventListener("click", function() {
      const tr = this.closest("tr");
      const clienteId = parseInt(tr.getAttribute("data-cliente-id"));
      const emprestimoId = parseInt(tr.getAttribute("data-emprestimo-id"));
      const numeroParcela = parseInt(tr.getAttribute("data-parcela-num"));
      solicitarSenhaPagar(clienteId, emprestimoId, numeroParcela);
    });
  });

  const modalEl = document.getElementById("modalDetalhes");
  new bootstrap.Modal(modalEl).show();

  modalEl.addEventListener('hidden.bs.modal', () => {
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  });
}

// Solicita senha para editar
function solicitarSenhaEditar(clienteId) {
  const senha = prompt("Digite a senha para editar o cliente:");
  if (senha === null) return;
  if (senha !== senhaUsuario) { alert("Senha de administrador incorreta!"); return; }
  editarCliente(clienteId);
}

// Solicita senha para pagar parcela
function solicitarSenhaPagar(clienteId, emprestimoId, numeroParcela) {
  const senha = prompt("Digite a senha para confirmar o pagamento da parcela:");
  if (senha === null) return;
  if (senha !== senhaUsuario) { alert("Senha incorreta!"); return; }
  pagarParcela(clienteId, emprestimoId, numeroParcela);
}

// Pagar parcela
function pagarParcela(clienteId, emprestimoId, numeroParcela) {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return;
  const emprestimo = cliente.emprestimos.find(e => e.id === emprestimoId);
  if (!emprestimo) return;
  const parcela = emprestimo.parcelas.find(p => p.numero === numeroParcela);
  if (!parcela) return;

  parcela.pago = true;

  // 🔽 Adiciona ao saldo o valor da parcela (com juros)
  saldoCaixa += parcela.valor;
  atualizarSaldo();

  calcularDivida(cliente);
  cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");
  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderizarClientes();
  abrirDetalhes(clienteId);
  alert(`Parcela #${numeroParcela} paga. Dívida atual: R$ ${cliente.divida.toFixed(2)}`);
}

// Adicionar cliente
document.getElementById("btnAdicionarCliente").addEventListener("click", () => {
  const nome = prompt("Nome do cliente:");
  if (!nome) return;

  const cpf = prompt("CPF (somente números):");
  if (!cpf) return;
  const cpfSomenteNumeros = cpf.replace(/\D/g, "");
  if (!validarCPF(cpfSomenteNumeros)) { alert("CPF inválido!"); return; }

  if (clientes.some(c => c.cpf === cpfSomenteNumeros && c.caixaId === idCaixa)) {
    alert("Cliente com este CPF já cadastrado neste caixa!");
    return;
  }

  const novo = { id: Date.now(), nome, cpf: cpfSomenteNumeros, caixaId: idCaixa, divida: 0, emprestimos: [], dataUltimaAlteracao: new Date().toLocaleString("pt-BR") };
  clientes.push(novo);
  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderizarClientes();
  alert("Cliente adicionado com sucesso!");
});

// Editar cliente
function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const nome = prompt("Editar nome do cliente:", cliente.nome);
  if (!nome) return;

  const cpf = prompt("Editar CPF (somente números):", cliente.cpf);
  if (!cpf) return;
  const cpfSomenteNumeros = cpf.replace(/\D/g, "");
  if (!validarCPF(cpfSomenteNumeros)) { alert("CPF inválido!"); return; }

  if (clientes.some(c => c.cpf === cpfSomenteNumeros && c.id !== id && c.caixaId === idCaixa)) {
    alert("Outro cliente com este CPF já cadastrado neste caixa!"); return;
  }

  cliente.nome = nome;
  cliente.cpf = cpfSomenteNumeros;
  cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");
  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderizarClientes();
  alert("Cliente atualizado com sucesso!");
}

// Excluir cliente (somente administrador)
function excluirCliente(id) {
  const senha = prompt("Digite a senha do ADMINISTRADOR para confirmar a exclusão:");
  if (senha === null) {
    alert("Operação cancelada!");
    return;
  }

  if (senha !== senhaAdmin) {
    alert("Senha de administrador incorreta!");
    return;
  }

  clientes = clientes.filter(c => c.id !== id);
  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderizarClientes();
  alert("Cliente excluído com sucesso!");
}

// Pesquisa
document.getElementById("pesquisa-cliente").addEventListener("input", e => renderizarClientes(e.target.value));

// Voltar
document.getElementById("btnVoltar").addEventListener("click", () => window.location.href = "painel.html");

// Event delegation para os botões dinâmicos da tabela
document.getElementById("tabelaClientes").addEventListener("click", e => {
  const id = e.target.closest("button")?.dataset.id;
  if (!id) return;

  if (e.target.closest(".btn-novo")) abrirModalEmprestimo(parseInt(id));
  else if (e.target.closest(".btn-editar")) solicitarSenhaEditar(parseInt(id));
  else if (e.target.closest(".btn-excluir")) excluirCliente(parseInt(id));
  else if (e.target.closest(".btn-detalhes")) abrirDetalhes(parseInt(id));
});

// Inicializa tabela
renderizarClientes();
atualizarSaldo();


