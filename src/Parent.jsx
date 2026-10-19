import Bouton1 from './Bouton1'

function Parent() {
    function recevoirMessage(message) {
        alert("Message reçu : " + message);
    }
  return (
    <div id="parent">
      <h2>Composant Parent</h2>
      <Bouton1 onMessage={recevoirMessage} />
    </div>
  );
}

export default Parent;