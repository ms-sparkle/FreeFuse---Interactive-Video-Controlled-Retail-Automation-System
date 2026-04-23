using Microsoft.Data.Sqlite;

class Program
{
    static void Main()
    {
        using var connection = new SqliteConnection("Data Source=app.db");
        connection.Open();

        // Initialize database tables
        AccountService.Initialize(connection);
        CoachService.Initialize(connection);
        AthleteService.Initialize(connection);
        AthleteService.InitializeSoreness(connection);

        while (true)
        {
            Console.WriteLine("==== MAIN MENU ====");
            Console.WriteLine("1. Register Coach");
            Console.WriteLine("2. Register Athlete");
            Console.WriteLine("3. Login");
            Console.WriteLine("4. Exit");
            Console.Write("Select option: ");

            string choice = Console.ReadLine();

            switch (choice)
            {
                case "1":
                    RegisterCoach(connection);
                    break;

                case "2":
                    RegisterAthlete(connection);
                    break;

                case "3":
                    LoginFlow(connection);
                    break;

                case "4":
                    return;

                default:
                    Console.WriteLine("Invalid option.\n");
                    break;
            }
        }
    }

    // ==============================
    // REGISTER COACH
    // ==============================
    static void RegisterCoach(SqliteConnection connection)
    {
        Console.Write("Username: ");
        string username = Console.ReadLine();

        Console.Write("Password: ");
        string password = Console.ReadLine();

        Console.Write("First Name: ");
        string firstName = Console.ReadLine();

        Console.Write("Last Name: ");
        string lastName = Console.ReadLine();

        Console.Write("Sport: ");
        string sport = Console.ReadLine();

        int userId = AccountService.CreateAccount(connection, username, password, "Coach");

        CoachService.CreateCoach(connection, userId, firstName, lastName, sport);

        Console.WriteLine("Coach registered successfully!\n");
    }

    // ==============================
    // REGISTER ATHLETE
    // ==============================
    static void RegisterAthlete(SqliteConnection connection)
    {
        Console.Write("Username: ");
        string username = Console.ReadLine();

        Console.Write("Password: ");
        string password = Console.ReadLine();

        Console.Write("First Name: ");
        string firstName = Console.ReadLine();

        Console.Write("Last Name: ");
        string lastName = Console.ReadLine();

        Console.Write("Age: ");
        int age = int.Parse(Console.ReadLine());

        Console.Write("Sport: ");
        string sport = Console.ReadLine();

        //SHOW ALL COACHES BEFORE ASKING
        CoachService.ShowAllCoaches(connection);

        Console.Write("Enter Coach ID: ");
        int coachId = int.Parse(Console.ReadLine());

        int userId = AccountService.CreateAccount(connection, username, password, "Athlete");

        AthleteService.CreateAthlete(connection, userId, firstName, lastName, age, sport, coachId);

        Console.WriteLine("Athlete registered successfully!\n");
    }

    // ==============================
    // LOGIN
    // ==============================
    static void LoginFlow(SqliteConnection connection)
    {
        Console.Write("Username: ");
        string username = Console.ReadLine();

        Console.Write("Password: ");
        string password = Console.ReadLine();

        var result = AccountService.Login(connection, username, password);

        if (result != null)
        {
            var (userId, role) = result.Value;

            if (role == "Coach")
            {
                CoachService.ShowCoachDashboard(connection, userId);
            }
            else if (role == "Athlete")
            {
                AthleteService.ShowAthleteDashboard(connection, userId);
            }
        }
        else
        {
            Console.WriteLine("Invalid login.\n");
        }
    }
}