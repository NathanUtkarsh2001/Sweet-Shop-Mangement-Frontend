import api from '../../api/api'
import { useAuth } from '../../context/AuthContext'

interface SweetProps {
  sweet: {
    id: string
    name: string
    category: string
    price: number
    quantity: number
  }
}

const SweetItem = ({ sweet }: SweetProps) => {
  const { token } = useAuth()

  const purchase = async () => {
    try {
      await api.post(`/sweets/${sweet.id}/purchase`, { quantity: 1 })
      alert('Purchased 1 sweet!')
      window.location.reload()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error purchasing')
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', width: '200px' }}>
      <h3>{sweet.name}</h3>
      <p>{sweet.category}</p>
      <p>₹{sweet.price}</p>
      <p>Quantity: {sweet.quantity}</p>
      <button onClick={purchase} disabled={sweet.quantity === 0}>Purchase</button>
    </div>
  )
}

export default SweetItem
