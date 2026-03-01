using Microsoft.Data.Sqlite;

public static class AccountService
{
    public static void Initialize(SqliteConnection connection)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        CREATE TABLE IF NOT EXISTS Accounts (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username TEXT UNIQUE NOT NULL,
            Password TEXT NOT NULL,
            Role TEXT NOT NULL
        );
        ";
        command.ExecuteNonQuery();
    }

    public static int CreateAccount(SqliteConnection connection, string username, string password, string role)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        INSERT INTO Accounts (Username, Password, Role)
        VALUES ($username, $password, $role);
        SELECT last_insert_rowid();
        ";

        command.Parameters.AddWithValue("$username", username);
        command.Parameters.AddWithValue("$password", password);
        command.Parameters.AddWithValue("$role", role);

        return (int)(long)command.ExecuteScalar();
    }

    public static (int, string)? Login(SqliteConnection connection, string username, string password)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        SELECT Id, Role
        FROM Accounts
        WHERE Username = $username AND Password = $password;
        ";

        command.Parameters.AddWithValue("$username", username);
        command.Parameters.AddWithValue("$password", password);

        using var reader = command.ExecuteReader();

        if (reader.Read())
        {
            int id = reader.GetInt32(0);
            string role = reader.GetString(1);
            return (id, role);
        }

        return null;
    }
}