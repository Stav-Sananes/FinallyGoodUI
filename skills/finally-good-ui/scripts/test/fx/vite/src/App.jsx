import { motion } from "framer-motion";
import "./app.module.scss";

export default function App() {
  return (
    <div>
      <h1 style={{ color: "#10b981" }}>One</h1>
      <p style={{ color: "#10b981" }}>Two</p>
      <span style={{ borderColor: "#10B981", margin: "24px" }}>Three</span>
      <a style={{ color: "#3b82f6" }}>brand</a>
      <motion.div animate={{ height: 200 }} transition={{ ease: "easeIn" }} />
    </div>
  );
}
