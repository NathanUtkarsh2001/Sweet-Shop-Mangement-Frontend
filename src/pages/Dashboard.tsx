import { useEffect, useState } from 'react'
import api from '../api/api'
import SweetItem from '../components/Sweets/SweetItem'

interface Sweet {
  id: string
  name: string
  category: string
  price: number
  quantity: number
}

const Dashboard = () => {
  const [sweets, setSweets] = useState<Sweet[]>([])
  const [search, setSearch] = useState('')

  const fetchSweets = async () => {
    const res = await api.get('/sweets') as any
    setSweets(res.data)
  }

  useEffect(() => {
    fetchSweets()
  }, [])

  const filtered = sweets.filter(
    s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1>Sweet Shop</h1>
      <input placeholder="Search sweets..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {filtered.map(s => <SweetItem key={s.id} sweet={s} />)}
      </div>
    </div>
  )
}

export default Dashboard
