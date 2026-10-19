function Bouton1({onMessage}) {
  return (
    <button onClick={()=> onMessage("Bonjour depuis l'enfant !")}>
      Envoyer un message
    </button>
  );
}

export default Bouton1;