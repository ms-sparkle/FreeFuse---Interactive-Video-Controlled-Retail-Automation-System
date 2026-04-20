using Microsoft.Data.Sqlite;
using System;

public static class CoachService
{
    public static void Initialize(SqliteConnection connection)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        CREATE TABLE IF NOT EXISTS Coaches (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            AccountId INTEGER,
            FirstName TEXT,
            LastName TEXT,
            Sport TEXT
        );
        ";
        command.ExecuteNonQuery();
    }

    public static void CreateCoach(SqliteConnection connection, int accountId,
        string firstName, string lastName, string sport)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        INSERT INTO Coaches (AccountId, FirstName, LastName, Sport)
        VALUES ($accountId, $firstName, $lastName, $sport);
        ";

        command.Parameters.AddWithValue("$accountId", accountId);
        command.Parameters.AddWithValue("$firstName", firstName);
        command.Parameters.AddWithValue("$lastName", lastName);
        command.Parameters.AddWithValue("$sport", sport);

        command.ExecuteNonQuery();
    }

    public static void ShowAllCoaches(SqliteConnection connection)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        SELECT Id, FirstName, LastName, Sport
        FROM Coaches;
        ";

        using var reader = command.ExecuteReader();

        Console.WriteLine("\n=== Coaches ===");

        while (reader.Read())
        {
            Console.WriteLine(
                $"ID: {reader.GetInt32(0)} | " +
                $"{reader.GetString(1)} {reader.GetString(2)} | " +
                $"Sport: {reader.GetString(3)}"
            );
        }

        Console.WriteLine();
    }

    public static void ShowCoachDashboard(SqliteConnection connection, int accountId)
    {
        Console.WriteLine("\n=== Coach Dashboard ===");
        Console.WriteLine("1. View Athlete Reports");
        Console.WriteLine("2. Logout");
        Console.Write("Select: ");

        string choice = Console.ReadLine();

        if (choice == "1")
        {
            ViewAthleteReports(connection, accountId);
        }
    }

    public static void ViewAthleteReports(SqliteConnection connection, int accountId)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        SELECT A.FirstName, A.LastName, R.SorenessLevel, R.SleepHours
        FROM Athletes A
        JOIN Reports R ON A.Id = R.AthleteId
        WHERE A.CoachId = (
            SELECT Id FROM Coaches WHERE AccountId = $accountId
        );
        ";

        command.Parameters.AddWithValue("$accountId", accountId);

        using var reader = command.ExecuteReader();

        Console.WriteLine("\n=== Athlete Reports ===");

        while (reader.Read())
        {
            Console.WriteLine(
                $"{reader.GetString(0)} {reader.GetString(1)} | " +
                $"Soreness: {reader.GetInt32(2)} | " +
                $"Sleep: {reader.GetInt32(3)}"
            );
        }

        Console.WriteLine();
    }
}