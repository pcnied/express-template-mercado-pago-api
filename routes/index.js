const { MercadoPagoConfig, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const router = express.Router();

const client = new MercadoPagoConfig({
  accessToken: "SEU_ACCESS_TOKEN", // Defina o seu token de acesso aqui
  options: { timeout: 5000 },
});

const payment = new Payment(client);

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express v.0.0.1" });
});

router.post("/create_preference", function (req, res, next) {
  const { items, payerEmail } = req.body;

  const preference = {
    items: items,
    payer: {
      email: payerEmail,
    },
    back_urls: {
      success: "https://www.seu-site.com/success",
      failure: "https://www.seu-site.com/failure",
      pending: "https://www.seu-site.com/pending",
    },
    auto_return: "approved",
  };

  payment
    .create(preference)
    .then((response) => {
      console.log("Preference created successfully");
      console.log(response.body);
      res.json({ preferenceId: response.body.id });
    })
    .catch((error) => {
      console.log("Preference creation failed");
      console.log(error);
      res.status(500).json({ error: error.message });
    });
});

router.post("/payment-card", function (req, res, next) {
  console.log("REQUEST");
  console.log(req.body);

  const body = req.body;

  payment
    .create(
      {
        transaction_amount: body.transaction_amount,
        token: body.token,
        description: body.description,
        installments: body.installments,
        payment_method_id: body.payment_method_id,
        issuer_id: body.issuer_id,
        payer: {
          email: body.payer.email,
          identification: {
            type: body.payer.identification.type,
            number: body.payer.identification.number,
          },
        },
      },
      { idempotencyKey: uuidv4() }
    )
    .then((result) => {
      console.log("Payment processed successfully");
      console.log(result);
      res.json(result);
    })
    .catch((error) => {
      console.log("Payment processing failed");
      console.log(error);
      res.status(500).json({ error: error.message });
    });
});

router.post("/payment-pix", function (req, res, next) {
  console.log("REQUEST");
  console.log(req.body);

  const transaction_amount = parseFloat(req.body.transaction_amount);

  if (isNaN(transaction_amount)) {
    return res
      .status(400)
      .json({
        message: "transaction_amount deve ser um número válido",
        error: "bad_request",
      });
  }

  const body = {
    transaction_amount: transaction_amount,
    description: req.body.description,
    payment_method_id: req.body.payment_method_id,
    payer: {
      email: req.body.email,
      identification: {
        type: req.body.identification_type,
        number: req.body.number,
      },
    },
  };

  const requestOptions = { idempotencyKey: uuidv4() };

  payment
    .create({ body, requestOptions })
    .then((result) => {
      console.log("result");
      console.log(result);
      res.json(result);
    })
    .catch((error) => {
      console.log("ERROR");
      console.log(error);
      if (
        error.message === "Collector user without key enabled for QR render"
      ) {
        res
          .status(403)
          .json({
            error:
              "Conta do Mercado Pago não está habilitada para gerar QR codes. Verifique suas configurações ou entre em contato com o suporte do Mercado Pago.",
          });
      } else {
        res.status(500).json({ error: error.message });
      }
    });
});

module.exports = router;
