using Npgsql;

var connectionString = args.Length > 0
    ? args[0]
    : "Host=127.0.0.1;Port=32784;Database=linearprecision_test;Username=test;Password=test";

Console.WriteLine($"Connecting with: {connectionString}");

try
{
    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    await using var command = new NpgsqlCommand("select version();", connection);
    var version = await command.ExecuteScalarAsync();

    Console.WriteLine("Connection succeeded.");
    Console.WriteLine(version);
    await connection.CloseAsync();
    return;
}
catch (Exception ex)
{
    Console.WriteLine(ex);
    Environment.ExitCode = 1;
}
