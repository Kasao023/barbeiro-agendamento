# ✂️ Seu Jorge Barbearia — Sistema de Agendamento Online

Sistema completo de agendamento online para a barbearia **Seu Jorge**, localizada em Angatuba/SP. Desenvolvido com foco em **simplicidade para o cliente** e **eficiência para o barbeiro**.

![Status](https://img.shields.io/badge/status-ativo-success)
![Versão](https://img.shields.io/badge/versão-1.0.0-red)
![Licença](https://img.shields.io/badge/licença-MIT-blue)

---

## 🎯 Sobre o Projeto

O sistema permite que clientes agendem cortes, barbas e combos **diretamente pelo site**, sem precisar ligar ou esperar. O painel administrativo dá ao Seu Jorge **controle total** sobre agendamentos, serviços, folgas e faturamento.

### ✨ Principais recursos

- 🗓️ **Agendamento em 4 passos** — fluxo guiado com rolagem automática
- 📱 **Totalmente responsivo** — funciona perfeitamente no celular
- 🎨 **Design vintage** — tema gótico que combina com o logo da barbearia
- 📊 **Painel administrativo completo** — agendamentos, serviços, folgas e faturamento
- ⏳ **Lista de espera** — quando o dia está lotado, o cliente entra na fila
- 🚫 **Sistema de bloqueios** — folgas por dia, horário ou dia da semana
- 🔔 **Notificações push** — lembretes de agendamento (em configuração)
- 💬 **Integração WhatsApp** — envio automático da confirmação

---

## 🚀 Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| **HTML5 + CSS3** | Estrutura e estilização |
| **JavaScript (ES6+)** | Lógica de negócio e interatividade |
| **Bootstrap 5** | Framework de UI responsivo |
| **Firebase Realtime Database** | Armazenamento de dados em tempo real |
| **Firebase Authentication** | Login seguro do painel admin |
| **Firebase Cloud Messaging** | Notificações push (opcional) |
| **GitHub Pages** | Hospedagem do site |

---

## 📁 Estrutura do Projeto

```
Barbearia/
├── index.html                  # Página principal (site do cliente)
├── admin.html                  # Painel administrativo
├── meu-agendamento.html        # Consulta de agendamento do cliente
├── style.css                   # Estilos globais (tema vintage)
├── script.js                   # Lógica de agendamento
├── notifications.js            # Sistema de notificações
├── firebase-messaging-sw.js    # Service Worker de notificações
├── database.rules.json         # Regras de segurança do Firebase
├── firebase.json               # Configuração do Firebase CLI
├── seujorge.png                # Logo da barbearia
└── functions/                  # Cloud Functions (backend)
    ├── index.js                # Funções de notificação
    └── package.json            # Dependências
```

---

## 🔧 Como Usar

### Para o Cliente

1. Acesse o site
2. Escolha o serviço desejado
3. Selecione a data no calendário
4. Escolha o horário disponível
5. Preencha seus dados e confirme via WhatsApp

### Para o Barbeiro (Painel Admin)

1. Acesse `/admin.html`
2. Faça login com email e senha
3. Gerencie:
   - **Agendamentos** — visualizar, concluir, cancelar
   - **Serviços** — editar preços, nomes e durações
   - **Folgas** — bloquear dias e horários
   - **Lista de Espera** — chamar clientes quando vagar horário
   - **Faturamento** — relatório de ganhos por período

---

## 🔒 Segurança

O sistema utiliza **Firebase Authentication** para proteger o painel administrativo. As regras do banco de dados estão configuradas em `database.rules.json`.

> ⚠️ **Importante:** as chaves do Firebase (API Key, Database URL) são **públicas por design**. A segurança real vem das **Regras de Segurança** do banco de dados.

---

## 🌐 Deploy

O site está hospedado no **GitHub Pages**:

```
https://kasao023.github.io/barbeiro-agendamento/
```

Para atualizar o site, basta fazer commit e push na branch `main`.

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido por **Rômulo Petronilho**

---

## 📞 Contato

**Seu Jorge Barbearia**
📍 Angatuba, SP
📱 WhatsApp: (15) 99818-3052
🕐 Seg a Sáb — 9h às 20h

---

<p align="center">
  <i>Feito com ✂️ e ☕ para a melhor barbearia de Angatuba</i>
</p>