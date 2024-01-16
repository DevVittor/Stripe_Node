const express = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE);

//const endpointSecret = process.env.END_POINT_STRIPE

//Mongo DB

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/Stripe", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const Usuario = mongoose.model("Usuario", {
    // Defina os campos do seu modelo de usuário conforme necessário
    nome: String,
    email: String,
    dataCadastro: Date,
    assinaturaAtiva: Boolean,
});


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.disable('x-powered-by');

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

app.post("/webhooks",express.raw({type:"application/json"}),async(req,res)=>{
    const event = req.body;

    switch(event.type){
        case 'charge.succeeded':
            console.log("O Objeto: ",event.data.object);
            console.log("O Id: ",event.data.object.id);
            console.log("O nome: ",event.data.object.billing_details.name);
            console.log("O email: ",event.data.object.billing_details.email);
            console.log("Moeda de pagamento: ",event.data.object.currency);
            console.log("País do cliente: ",event.data.object.billing_details.address.country);
            console.log("Status de Pagamento: ",event.data.object.status);
            console.log("Link para acessar seu recibo a fatura e gerenciar a assinatura: ",event.data.object.receipt_url);
            console.log("Estou autorizado: ", event.data.object.outcome.type);
            break;
        default:
            break;
    }
    res.json({success:true});
})

/*app.post('/hooks', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('Received webhook payload:', req.body);
    const siginsecret = process.env.END_POINT_STRIPE;
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(payload, sig, siginsecret);

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Aqui você pode acessar informações do usuário do evento e atualizar o MongoDB
                const userId = session.customer;
                const user = await Usuario.findOne({ _id: userId });

                if (user) {
                    // Atualize as informações do usuário conforme necessário
                    user.dataCadastro = new Date(); // Exemplo de atualização de data de cadastro
                    user.assinaturaAtiva = true; // Exemplo de atualização de status de assinatura

                    // Salve as alterações no banco de dados
                    await user.save();
                }
                break;

            // Outros casos de webhook...

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ mensagem: "Sucesso!" });
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        res.status(400).json({ mensagem: "Deu ruim" });
    }
});*/



const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
