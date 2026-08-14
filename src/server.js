import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
createApp().listen(port, () => console.log(`Logistics AI Control Tower listening on http://localhost:${port}`));
