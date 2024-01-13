const express = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE);

//const endpointSecret = process.env.END_POINT_STRIPE

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const idUser = 2;
app.get("/", (req, res) => {
    res.render("Home");
});
app.get("/success", (req, res) => {
    res.render("Success", { id: idUser });
});
app.get("/cancel", (req, res) => {
    res.render("Cancel");
});

app.post("/createcheckoutsession", async (req, res) => {
    try {
        const { emailUser, priceId } = req.body;
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `http://localhost:${port}/success?session_id=${idUser}`,
            cancel_url: `http://localhost:${port}/cancel`,
            customer_email: emailUser,
        });
        res.redirect(303, session.url);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar a sessão de checkout." });
    }
});

app.post('/hooks', express.raw({type: 'application/json'}), (req, res) => {
    console.log('Received webhook payload:', req.body);
    const siginsecret = process.env.END_POINT_STRIPE;
    const payload = req.body;
    const sig  =req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, siginsecret);
    } catch (error) {
        console.log(error.mensagem)
        res.status(400).json({mensagem:"Deu ruim"});
        return;
    }

    //OK

    console.log(event.type);
    console.log(event.data.object);
    console.log(event.data.object.id);
    res.json({mensagem: "Sucesso!"});

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            console.log('Payment Intent Succeeded:', paymentIntentSucceeded);
            break;
        case 'subscription.payment_succeeded':
            console.log('Subscription Payment Succeeded:', event.data.object);
                // Adicione o código aqui para processar as informações no seu banco de dados
            res.status(200).json({mensagem:"subscription.payment_succeeded"});
            break;
        default:
        console.log(`Unhandled event type ${event.type}`);
    }
        res.send();
    });

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
