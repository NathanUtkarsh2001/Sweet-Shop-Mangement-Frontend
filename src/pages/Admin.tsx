import { useState, useEffect } from "react";
import api from "../api/api";
import SweetItem from "../components/Sweets/SweetItem";

const Admin = () => {
  const [sweets, setSweets] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const fetchSweets = async () => {
    const res = (await api.get("/sweets")) as any;
    setSweets(res.data);
  };

  useEffect(() => {
    fetchSweets();
  }, []);

  const addSweet = async () => {
    await api.post("/sweets", { name, category, price, quantity });
    fetchSweets();
  };

  const deleteSweet = async (id: string) => {
    await api.delete(`/sweets/${id}`);
    fetchSweets();
  };

  return (
    <div>
      <h1>Admin Panel</h1>
      <div>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
        />
        <button onClick={addSweet}>Add Sweet</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {sweets.map((s) => (
          <div key={s.id}>
            <SweetItem sweet={s} />
            <button onClick={() => deleteSweet(s.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
