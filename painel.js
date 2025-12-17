document.addEventListener("DOMContentLoaded", () => {

    // 🔐 Recupera sessão
    const sessao = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (!sessao || !sessao.nome || !sessao.senha) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "index.html";
        return;
    }

    const usuario = sessao.nome;
    const senhaUsuario = sessao.senha;
    const rpUsuario = sessao.rp || "—";

    // Exibe nome do usuário
    document.getElementById("nome-usuario").textContent = usuario;

    // Saldo e status do caixa
    let saldo = parseFloat(localStorage.getItem("saldoCaixa") || "0");
    let caixaAberto = localStorage.getItem("caixaAberto") === "true";

    const saldoSpan = document.getElementById("saldo-caixa");
    const statusSimbolo = document.getElementById("status-simbolo");
    const statusTexto = document.getElementById("status-texto");
    const dataHoraSpan = document.getElementById("data-hora");

    // Inicializa eventos do caixa
    let eventosCaixa = JSON.parse(localStorage.getItem("eventosCaixa") || "[]");

    // Exibe RP no canto inferior direito (formatado com 3 dígitos)
    const painelContainer = document.querySelector(".painel-container");
    const rpDiv = document.createElement("div");
    rpDiv.id = "rp-usuario";
    const rpFormatada = rpUsuario ? rpUsuario.toString().padStart(3, "0") : "000";
    rpDiv.textContent = `RP: ${rpFormatada}`;
    rpDiv.style.position = "absolute";
    rpDiv.style.bottom = "10px";
    rpDiv.style.right = "10px";
    rpDiv.style.fontSize = "0.8rem";
    rpDiv.style.color = "#666";
    rpDiv.style.backgroundColor = "rgba(255,255,255,0.8)";
    rpDiv.style.padding = "4px 8px";
    rpDiv.style.borderRadius = "4px";
    rpDiv.style.boxShadow = "0 0 5px rgba(0,0,0,0.2)";
    painelContainer.appendChild(rpDiv);

    // 🔑 Validação de senha
    function validarSenha() {
        const senhaDigitada = prompt("Digite sua senha para continuar:");
        if (senhaDigitada === null) {
            alert("Operação cancelada!");
            return false;
        }
        if (senhaDigitada === senhaUsuario) {
            return true;
        } else {
            alert("Senha incorreta!");
            return false;
        }
    }

    // 💰 Formatação de moeda
    function formatarValor(valor) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2
        }).format(valor);
    }

    // 🔄 Atualiza status do caixa
    function atualizarStatus() {
        if (caixaAberto) {
            statusSimbolo.classList.remove("fechado");
            statusSimbolo.classList.add("aberto");
            statusTexto.textContent = "Aberto";
        } else {
            statusSimbolo.classList.remove("aberto");
            statusSimbolo.classList.add("fechado");
            statusTexto.textContent = "Fechado";
        }
        saldoSpan.textContent = formatarValor(saldo);
    }

    // 🔓 Abrir caixa
    function abrirCaixa() {
        if (caixaAberto) {
            alert("O caixa já está aberto!");
            return;
        }
        if (!validarSenha()) return;

        caixaAberto = true;
        localStorage.setItem("caixaAberto", "true");

        alert(`✅ Caixa aberto! Saldo atual: ${formatarValor(saldo)}`);
        atualizarStatus();
    }

    // 🔒 Fechar caixa
    function fecharCaixa() {
        if (!caixaAberto) {
            alert("O caixa já está fechado!");
            return;
        }
        if (!validarSenha()) return;

        caixaAberto = false;
        localStorage.setItem("caixaAberto", "false");
        localStorage.setItem("saldoCaixa", saldo.toFixed(2));

        alert(`✅ Caixa fechado! Saldo final: ${formatarValor(saldo)}`);
        atualizarStatus();
    }

    // 👥 Clientes
    function abrirClientes() {
        if (!caixaAberto) {
            alert("Abra o caixa antes de acessar os clientes!");
            return;
        }
        window.location.href = "clientes.html";
    }

    // 🚪 Logout
    function logout() {
        localStorage.removeItem("usuarioLogado");
        localStorage.removeItem("caixaAberto");
        window.location.href = "Login.html";
    }

    // ⏰ Data e hora
    function atualizarDataHora() {
        const agora = new Date();
        const data = agora.toLocaleDateString("pt-BR");
        const hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
        dataHoraSpan.textContent = `${data} ${hora}`;
    }
    setInterval(atualizarDataHora, 1000);
    atualizarDataHora();

    // 🎯 Eventos
    document.getElementById("btnAbrir").addEventListener("click", abrirCaixa);
    document.getElementById("btnFechar").addEventListener("click", fecharCaixa);
    document.getElementById("btnEmprestimo").addEventListener("click", abrirClientes);
    document.getElementById("btnLogout").addEventListener("click", logout);

    // 💸 Saque
    document.getElementById("btnExtra2").addEventListener("click", () => {
        if (!caixaAberto) {
            alert("Abra o caixa antes de realizar saques!");
            return;
        }
        if (!validarSenha()) return;

        let valorInput = prompt("Digite o valor do saque:");
        if (valorInput !== null && valorInput.trim() !== "") {
            let valor = parseFloat(valorInput.replace(",", "."));
            if (!isNaN(valor)) {
                if (valor > saldo) {
                    alert("Saldo insuficiente para este saque!");
                    return;
                }
                saldo -= valor;
                saldoSpan.textContent = formatarValor(saldo);
                localStorage.setItem("saldoCaixa", saldo.toFixed(2));

                eventosCaixa.push({
                    tipo: "saque",
                    valor: valor,
                    data: new Date().toISOString()
                });
                localStorage.setItem("eventosCaixa", JSON.stringify(eventosCaixa));

                alert(`✅ Saque realizado! Saldo atualizado: ${formatarValor(saldo)}`);
            } else {
                alert("Valor inválido. Digite apenas números.");
            }
        }
    });

    // 🔧 Depósito
    document.getElementById("btnExtra3").addEventListener("click", () => {
        if (!caixaAberto) {
            alert("Abra o caixa antes de adicionar valores!");
            return;
        }
        if (!validarSenha()) return;

        let valorInput = prompt("Digite o valor a adicionar ao saldo:");
        if (valorInput !== null && valorInput.trim() !== "") {
            let valor = parseFloat(valorInput.replace(",", "."));
            if (!isNaN(valor)) {
                saldo += valor;
                saldoSpan.textContent = formatarValor(saldo);
                localStorage.setItem("saldoCaixa", saldo.toFixed(2));

                eventosCaixa.push({
                    tipo: "deposito",
                    valor: valor,
                    data: new Date().toISOString()
                });
                localStorage.setItem("eventosCaixa", JSON.stringify(eventosCaixa));

                alert(`✅ Valor adicionado! Saldo atualizado: ${formatarValor(saldo)}`);
            } else {
                alert("Valor inválido. Digite apenas números.");
            }
        }
    });

    // 📊 Relatórios
    function mostrarRelatorios() {
        let tipoRelatorio = prompt("Escolha o relatório:\n1 - Extrato\n2 - Recebimentos do dia\n3 - Recebimentos do mês\n4 - Empréstimos do dia");

        if (!tipoRelatorio) return;

        const hoje = new Date();
        const diaAtual = hoje.toISOString().split("T")[0];
        const mesAtual = hoje.toISOString().slice(0, 7);

        let resultados = [];

        switch (tipoRelatorio) {
            case "1": // Extrato
                resultados = eventosCaixa.map(ev => {
                    return `${ev.tipo.toUpperCase()}: ${formatarValor(ev.valor)} | ${new Date(ev.data).toLocaleString("pt-BR")}`;
                });
                break;

            case "2": // Recebimentos do dia (depósitos e pagamentos)
                resultados = eventosCaixa.filter(ev => {
                    return ["deposito", "recebimento", "emprestimo"].includes(ev.tipo) &&
                        ev.data.startsWith(diaAtual);
                }).map(ev => `${ev.tipo.toUpperCase()}: ${formatarValor(ev.valor)} | ${new Date(ev.data).toLocaleTimeString("pt-BR")}`);
                break;

            case "3": // Recebimentos do mês
                resultados = eventosCaixa.filter(ev => {
                    return ["deposito", "recebimento", "emprestimo"].includes(ev.tipo) &&
                        ev.data.startsWith(mesAtual);
                }).map(ev => `${ev.tipo.toUpperCase()}: ${formatarValor(ev.valor)} | ${new Date(ev.data).toLocaleDateString("pt-BR")}`);
                break;

            case "4": // Empréstimos do dia
                resultados = eventosCaixa.filter(ev => ev.tipo === "emprestimo" && ev.data.startsWith(diaAtual))
                    .map(ev => `${ev.tipo.toUpperCase()}: ${formatarValor(ev.valor)} | ${new Date(ev.data).toLocaleTimeString("pt-BR")}`);
                break;

            default:
                alert("Opção inválida!");
                return;
        }

        if (resultados.length === 0) {
            alert("Nenhum registro encontrado!");
        } else {
            alert("📊 Relatório:\n\n" + resultados.join("\n"));
        }
    }

    // Botão Relatórios (no modal de Configurações)
    document.getElementById("btnRelatorios")?.addEventListener("click", mostrarRelatorios);

    // Botão Configurações abre o modal
    const btnConfiguracoes = document.getElementById("btnExtra1");
    const modalConfig = new bootstrap.Modal(document.getElementById("modalConfiguracoes"));

    btnConfiguracoes.addEventListener("click", () => {
        modalConfig.show();
    });

    // Botão Cadastrar Novo Usuário (apenas teste, não salva no Firebase)
    document.getElementById("btnCadastrarUsuario").addEventListener("click", () => {
        alert("💡 Aqui você pode abrir o formulário de cadastro de usuário (teste).");
    });

    // Inicializa
    atualizarStatus();
});

