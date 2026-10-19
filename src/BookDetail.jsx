import { useParams } from 'react-router-dom'
function BookDetail() {
 const { id } = useParams()
 return <p>Vous consultez le livre avec l’ID : {id}</p>
}

export default BookDetail;