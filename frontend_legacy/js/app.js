document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const userInput = document.getElementById("userInput");
  const responseArea = document.getElementById("responseArea");

  const messages = [];

  /**
   * Converte URLs em links clicáveis.
   */
  const formatTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  };

  /**
   * Formata o texto de contexto para exibição em linhas separadas.
   */
  const formatContext = (contextArray) => {
    return contextArray
      .map((context) => {
        return `<div class="context-item">Contexto: ${formatTextWithLinks(context)}</div>`;
      })
      .join(""); // Mantém cada contexto em uma linha separada
  };

  /**
   * Renderiza as mensagens na tela.
   */
  const renderMessages = () => {
    responseArea.innerHTML = "";
    messages.forEach((msg) => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message", msg.sender === "user" ? "user-message" : "bot-message");
      messageElement.innerHTML = msg.text;
      responseArea.appendChild(messageElement);
    });

    // Rolagem automática para a última mensagem
    responseArea.scrollTop = responseArea.scrollHeight;
  };

  /**
   * Envia a pergunta e exibe a resposta.
   */
  const sendMessage = async () => {
    const question = userInput.value.trim();
    if (!question) return;

    // Adiciona a mensagem do usuário
    messages.unshift({ text: `<strong>Você:</strong> ${question}`, sender: "user" });
    renderMessages();

    // Limpa o input imediatamente
    userInput.value = "";

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: question }),
      });

      if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.status}`);
      }

      const data = await res.json();
      const responses = data.response || ["Nenhuma resposta encontrada."];

      // A primeira mensagem é a resposta
      messages.unshift({ text: `<strong>Resposta:</strong> ${formatTextWithLinks(responses[0])}`, sender: "bot" });

      // O restante são os contextos
      if (responses.length > 1) {
        const contextTexts = responses.slice(1);
        const formattedContext = formatContext(contextTexts);
        messages.unshift({ text: formattedContext, sender: "bot" });
      }

      renderMessages();
    } catch (error) {
      console.error("Erro ao enviar a pergunta:", error);
      messages.unshift({ text: "Erro ao processar a solicitação.", sender: "bot" });
      renderMessages();
    }
  };

  if (submitBtn) {
    submitBtn.addEventListener("click", sendMessage);
  }

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});
