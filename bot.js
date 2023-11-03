const userState = {};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      const payload = await request.json();

      if ('message' in payload) {
        const chatId = payload.message.chat.id;
        const input = String(payload.message.text).trim();
        const user_firstname = String(payload.message.from.first_name);

        if (!userState[chatId]) {
          userState[chatId] = {};
        }

        if (userState[chatId].state === 'waiting_for_quantity') {
          const quantity = parseFloat(input);

          if (!isNaN(quantity)) {
            const unitPrice = userState[chatId].unitPrice;
            const total = unitPrice * quantity;
            const response = `${user_firstname}, the total price for your tiles is ${total}.`;

            await this.sendMessage(env.API_KEY, chatId, response);

            // Reset the user state and show the tiles menu again
            userState[chatId] = {};
            const message = "Choose a tile type:";
            const inlineKeyboard = [
              [{ text: "20x20 cm - 50/unit", callback_data: "50" }],
              [{ text: "35x50 cm - 70/unit", callback_data: "70" }]
            ];

            await this.sendMessageWithKeyboard(env.API_KEY, chatId, message, inlineKeyboard);
          } else {
            const askResponse = `${user_firstname}, please enter a valid quantity.`;

            await this.sendMessage(env.API_KEY, chatId, askResponse);
          }
        } else if (input === '/start') { // Add a new condition for /start command
          // Show the menu options
          const message = "Welcome to the Price Calculator bot!";
          const inlineKeyboard = [
            [{ text: "Price Calculator", callback_data: "price_calculator" }],
            [{ text: "Gallery", callback_data: "gallery" }], // New Gallery option
            [{ text: "About", callback_data: "about" }]      // New About option
          ];

          await this.sendMessageWithKeyboard(env.API_KEY, chatId, message, inlineKeyboard);

          userState[chatId].state = 'waiting_for_start_choice';
        } else {
          // Show an error message if the input is not valid
          const errorMessage = "Sorry, I don't understand that command. Please use /start to see the available options.";

          await this.sendMessage(env.API_KEY, chatId, errorMessage);
        }
      } else if ('callback_query' in payload) {
        const chatId = payload.callback_query.message.chat.id;
        const data = payload.callback_query.data;

        if (data === 'price_calculator') { // Add a new condition for price_calculator callback
          // Show the tiles menu
          const message = "Choose a tile type:";
          const inlineKeyboard = [
            [{ text: "20x20 cm - 50/unit", callback_data: "50" }],
            [{ text: "35x50 cm - 70/unit", callback_data: "70" }]
          ];

          await this.sendMessageWithKeyboard(env.API_KEY, chatId, message, inlineKeyboard);

          userState[chatId].state = 'waiting_for_tile_choice';
        } else if (data === 'gallery') {
          // Code to show the gallery would go here
          // For now, let's send a placeholder message
          const message = "Gallery feature is under construction.";
          await this.sendMessage(env.API_KEY, chatId, message);
        } else if (data === 'about') {
          // Code to show the about information would go here
          // For now, let's send a placeholder message
          const message = "This bot was created to help with tile pricing.";
          await this.sendMessage(env.API_KEY, chatId, message);
        } else {
          // The original code for choosing tile type and quantity
          userState[chatId].unitPrice = parseFloat(data);

          userState[chatId].state = 'waiting_for_quantity';

          const askResponse = "Please enter the quantity:";

          await this.sendMessage(env.API_KEY, chatId, askResponse);
        }
      }
    }

    return new Response('OK');
  },

  async sendMessage(apiKey, chatId, text) {
    const url = `https://api.telegram.org/bot${apiKey}/sendMessage?chat_id=${chatId}&text=${text}`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  },

  async sendMessageWithKeyboard(apiKey, chatId, text, inlineKeyboard) {
    const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: text,
      reply_markup: JSON.stringify({
        inline_keyboard: inlineKeyboard
      })
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }
};
