using Microsoft.Data.Sqlite;
using System;

public static class AthleteService
{
    public static void Initialize(SqliteConnection connection)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        CREATE TABLE IF NOT EXISTS Athletes (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            AccountId INTEGER,
            FirstName TEXT,
            LastName TEXT,
            Age INTEGER,
            Sport TEXT,
            CoachId INTEGER
        );
        ";
        command.ExecuteNonQuery();
    }

    public static void InitializeSoreness(SqliteConnection connection)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        CREATE TABLE IF NOT EXISTS Reports (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            AthleteId INTEGER,
            SorenessLevel INTEGER,
            SleepHours INTEGER
        );
        ";
        command.ExecuteNonQuery();
    }

    public static void CreateAthlete(SqliteConnection connection, int accountId,
        string firstName, string lastName, int age,
        string sport, int coachId)
    {
        var command = connection.CreateCommand();
        command.CommandText =
        @"
        INSERT INTO Athletes
        (AccountId, FirstName, LastName, Age, Sport, CoachId)
        VALUES ($accountId, $firstName, $lastName, $age, $sport, $coachId);
        ";

        command.Parameters.AddWithValue("$accountId", accountId);
        command.Parameters.AddWithValue("$firstName", firstName);
        command.Parameters.AddWithValue("$lastName", lastName);
        command.Parameters.AddWithValue("$age", age);
        command.Parameters.AddWithValue("$sport", sport);
        command.Parameters.AddWithValue("$coachId", coachId);

        command.ExecuteNonQuery();
    }

    public static void ShowAthleteDashboard(SqliteConnection connection, int accountId)
    {
        Console.WriteLine("\n=== Athlete Dashboard ===");
        Console.Write("Enter soreness level (1-10): ");
        int soreness = int.Parse(Console.ReadLine());

        Console.Write("Enter sleep hours: ");
        int sleep = int.Parse(Console.ReadLine());

        var command = connection.CreateCommand();
        command.CommandText =
        @"
        INSERT INTO Reports (AthleteId, SorenessLevel, SleepHours)
        VALUES (
            (SELECT Id FROM Athletes WHERE AccountId = $accountId),
            $soreness,
            $sleep
        );
        ";

        command.Parameters.AddWithValue("$accountId", accountId);
        command.Parameters.AddWithValue("$soreness", soreness);
        command.Parameters.AddWithValue("$sleep", sleep);

        command.ExecuteNonQuery();

        Console.WriteLine("Report submitted!\n");
    }
}