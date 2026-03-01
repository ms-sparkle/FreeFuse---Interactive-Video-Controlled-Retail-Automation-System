using Microsoft.Data.Sqlite;
using System;

public static class SorenessService
{
    public static void AddSorenessReport(SqliteConnection connection, int userId)
    {
        Console.Write("Enter report date (YYYY-MM-DD): ");
        string date = Console.ReadLine();

        using var command = connection.CreateCommand();

        command.CommandText = @"
            INSERT INTO SORENESSREPORT (ReportDate, UserID)
            VALUES ($date, $userId);
            SELECT last_insert_rowid();
        ";

        command.Parameters.AddWithValue("$date", date);
        command.Parameters.AddWithValue("$userId", userId);

        long reportId = (long)command.ExecuteScalar();

        Console.WriteLine("How many body parts to report?");
        int count;
        while (!int.TryParse(Console.ReadLine(), out count) || count <= 0)
        {
            Console.Write("Enter a valid number: ");
        }

        for (int i = 0; i < count; i++)
        {
            Console.Write("Body Part Name: ");
            string bodyPart = Console.ReadLine();

            Console.Write("Side (Left/Right/None): ");
            string side = Console.ReadLine();

            Console.Write("Soreness Level (1-10): ");
            int level;
            while (!int.TryParse(Console.ReadLine(), out level) || level < 1 || level > 10)
            {
                Console.Write("Enter number between 1 and 10: ");
            }

            // Insert body part if not exists
            command.CommandText = @"
                INSERT INTO BODYPART (Name, Side)
                SELECT $name, $side
                WHERE NOT EXISTS (
                    SELECT 1 FROM BODYPART WHERE Name = $name AND Side = $side
                );
            ";
            command.Parameters.Clear();
            command.Parameters.AddWithValue("$name", bodyPart);
            command.Parameters.AddWithValue("$side", side);
            command.ExecuteNonQuery();

            // Get BodyPartID
            command.CommandText = @"
                SELECT BodyPartID FROM BODYPART
                WHERE Name = $name AND Side = $side;
            ";
            command.Parameters.Clear();
            command.Parameters.AddWithValue("$name", bodyPart);
            command.Parameters.AddWithValue("$side", side);

            int bodyPartId = Convert.ToInt32(command.ExecuteScalar());

            // Insert soreness entry
            command.CommandText = @"
                INSERT INTO SORENESSENTRY (ReportID, BodyPartID, SorenessLevel)
                VALUES ($reportId, $bodyPartId, $level);
            ";
            command.Parameters.Clear();
            command.Parameters.AddWithValue("$reportId", reportId);
            command.Parameters.AddWithValue("$bodyPartId", bodyPartId);
            command.Parameters.AddWithValue("$level", level);

            command.ExecuteNonQuery();
        }

        Console.WriteLine("Soreness report saved successfully!");
    }

    public static void ViewSorenessReports(SqliteConnection connection, int userId)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT r.ReportDate, b.Name, b.Side, e.SorenessLevel
            FROM SORENESSREPORT r
            JOIN SORENESSENTRY e ON r.ReportID = e.ReportID
            JOIN BODYPART b ON e.BodyPartID = b.BodyPartID
            WHERE r.UserID = $userId
            ORDER BY r.ReportDate DESC;
        ";
        command.Parameters.AddWithValue("$userId", userId);

        using var reader = command.ExecuteReader();

        Console.WriteLine("\n--- Soreness Reports ---");

        while (reader.Read())
        {
            Console.WriteLine(
                $"Date: {reader.GetString(0)} | " +
                $"Body Part: {reader.GetString(1)} ({reader.GetString(2)}) | " +
                $"Level: {reader.GetInt32(3)}"
            );
        }
    }
}