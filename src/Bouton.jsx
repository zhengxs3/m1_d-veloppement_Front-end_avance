function Bouton() {

    function handleClick() {
        alert("Vous avez cliqué sur le bouton !");
    }

  return <button onClick={handleClick}>Cliquer ici</button>;
}

export default Bouton;