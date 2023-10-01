const express = require("express");
const app = express();
const stripe = require("stripe")(
    "sk_test_51NFJyxIbcEgeFqaq0ILbBdwIJq3K2gZaN8HYHg0ZPvX9Zt1MOGAcwfLJkyp66pvzmxIy04OyZIAIp6VsTbAct3bN00shEhxkL9",
);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("Home");
});
app.get("/success", (req, res) => {
    res.render("Success");
});

app.post("/createcheckoutsession", async (req, res) => {
    try {
        const emailUser = "customerEmail@gmail.com";
        const nameUser = "Pedro Henrique Costa";
        const priceId = req.body.priceId;
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    // For metered billing, do not pass quantity
                    quantity: 1,
                },
            ],
            success_url: "http://localhost:3000/success?session_id=1",
            cancel_url: "https://www.youtube.com/",
            customer_email: emailUser,
        });
        res.redirect(303, session.url);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar a sessão de checkout." });
    }
});

app.post("/webhook", async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    const webhookSecret =
        "whsec_ab52b8ac7237545793af5715c799ddcde7fa2dcbb9de7323600862ad57644608";
    if (webhookSecret) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                webhookSecret,
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        // Extract the object from the event.
        data = event.data;
        eventType = event.type;
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    switch (eventType) {
        case "checkout.session.completed":
            // Payment is successful and the subscription is created.
            // You should provision the subscription and save the customer ID to your database.
            break;
        case "invoice.paid":
            // Continue to provision the subscription as payments continue to be made.
            // Store the status in your database and check when a user accesses your service.
            // This approach helps you avoid hitting rate limits.
            break;
        case "invoice.payment_failed":
            // The payment failed or the customer does not have a valid payment method.
            // The subscription becomes past_due. Notify your customer and send them to the
            // customer portal to update their payment information.
            break;
        default:
        // Unhandled event type
    }

    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
