using Microsoft.Data.Sqlite;

public static class DatabaseInitializer
{
    public static void Initialize(SqliteConnection connection)
    {
        using var command = connection.CreateCommand();

        command.CommandText = @"

        CREATE TABLE IF NOT EXISTS ACCOUNT (
            AccountID INTEGER PRIMARY KEY AUTOINCREMENT,
            Username TEXT UNIQUE NOT NULL,
            PasswordHash TEXT NOT NULL,
            Role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS COACH (
            CoachID INTEGER PRIMARY KEY AUTOINCREMENT,
            AccountID INTEGER NOT NULL,
            FirstName TEXT,
            LastName TEXT,
            FOREIGN KEY(AccountID) REFERENCES ACCOUNT(AccountID)
        );

        CREATE TABLE IF NOT EXISTS ATHLETE (
            AthleteID INTEGER PRIMARY KEY AUTOINCREMENT,
            AccountID INTEGER NOT NULL,
            FirstName TEXT,
            LastName TEXT,
            Age INTEGER,
            SportPlayed TEXT,
            CoachID INTEGER NULL,
            FOREIGN KEY(AccountID) REFERENCES ACCOUNT(AccountID),
            FOREIGN KEY(CoachID) REFERENCES COACH(CoachID)
        );

        ";

        command.ExecuteNonQuery();
    }
}