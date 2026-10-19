function User() {
    let listUsers = ["John", "Jane", "Bob"];
  return (
    <div id="user">
      <ul>
        {listUsers.map((premon) => (
          <li key="index">{premon}</li>
        ))}
      </ul>
    </div>
  );
}
export default User;