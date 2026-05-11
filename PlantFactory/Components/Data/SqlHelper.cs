using Microsoft.Data.SqlClient;
using System.Data;

namespace PlantFactory.Components.Data;

public class SqlHelper
{
    private readonly string _connectionString;

    public SqlHelper(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("连接字符串 'DefaultConnection' 未配置。");
    }

    #region 连接管理

    private SqlConnection CreateConnection()
    {
        var conn = new SqlConnection(_connectionString);
        conn.Open();
        return conn;
    }

    private async Task<SqlConnection> CreateConnectionAsync(CancellationToken ct = default)
    {
        var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        return conn;
    }

    #endregion

    #region 查询 → DataTable

    public DataTable ExecuteQuery(string sql, params SqlParameter[] parameters)
    {
        using var conn = CreateConnection();
        using var cmd = new SqlCommand(sql, conn);
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);

        var dt = new DataTable();
        using var adapter = new SqlDataAdapter(cmd);
        adapter.Fill(dt);
        return dt;
    }

    public DataTable ExecuteQuery(string sql, Dictionary<string, object>? parameters = null)
        => ExecuteQuery(sql, ConvertToSqlParameters(parameters) ?? []);

    public async Task<DataTable> ExecuteQueryAsync(string sql, params SqlParameter[] parameters)
    {
        using var conn = await CreateConnectionAsync();
        using var cmd = new SqlCommand(sql, conn);
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);

        var dt = new DataTable();
        using var reader = await cmd.ExecuteReaderAsync();
        dt.Load(reader);
        return dt;
    }

    public Task<DataTable> ExecuteQueryAsync(string sql, Dictionary<string, object>? parameters = null)
        => ExecuteQueryAsync(sql, ConvertToSqlParameters(parameters) ?? []);

    #endregion

    #region 非查询（INSERT/UPDATE/DELETE）

    public int ExecuteNonQuery(string sql, params SqlParameter[] parameters)
    {
        using var conn = CreateConnection();
        using var cmd = new SqlCommand(sql, conn);
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);
        return cmd.ExecuteNonQuery();
    }

    public int ExecuteNonQuery(string sql, Dictionary<string, object>? parameters = null)
        => ExecuteNonQuery(sql, ConvertToSqlParameters(parameters) ?? []);

    public async Task<int> ExecuteNonQueryAsync(string sql, params SqlParameter[] parameters)
    {
        using var conn = await CreateConnectionAsync();
        using var cmd = new SqlCommand(sql, conn);
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);
        return await cmd.ExecuteNonQueryAsync();
    }

    public Task<int> ExecuteNonQueryAsync(string sql, Dictionary<string, object>? parameters = null)
        => ExecuteNonQueryAsync(sql, ConvertToSqlParameters(parameters) ?? []);

    #endregion

    #region 标量查询

    public object? ExecuteScalar(string sql, params SqlParameter[] parameters)
    {
        using var conn = CreateConnection();
        using var cmd = new SqlCommand(sql, conn);
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);
        return cmd.ExecuteScalar();
    }

    public object? ExecuteScalar(string sql, Dictionary<string, object>? parameters = null)
        => ExecuteScalar(sql, ConvertToSqlParameters(parameters) ?? []);

    public async Task<object?> ExecuteScalarAsync(string sql, params SqlParameter[] parameters)
    {
        using var conn = await CreateConnectionAsync();
        using var cmd = new SqlCommand(sql, conn);
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);
        return await cmd.ExecuteScalarAsync();
    }

    public Task<object?> ExecuteScalarAsync(string sql, Dictionary<string, object>? parameters = null)
        => ExecuteScalarAsync(sql, ConvertToSqlParameters(parameters) ?? []);

    #endregion

    #region 存储过程

    public DataTable ExecuteStoredProcedure(string procedureName, params SqlParameter[] parameters)
    {
        using var conn = CreateConnection();
        using var cmd = new SqlCommand(procedureName, conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);

        var dt = new DataTable();
        using var adapter = new SqlDataAdapter(cmd);
        adapter.Fill(dt);
        return dt;
    }

    public async Task<DataTable> ExecuteStoredProcedureAsync(string procedureName, params SqlParameter[] parameters)
    {
        using var conn = await CreateConnectionAsync();
        using var cmd = new SqlCommand(procedureName, conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        if (parameters is { Length: > 0 }) cmd.Parameters.AddRange(parameters);

        var dt = new DataTable();
        using var reader = await cmd.ExecuteReaderAsync();
        dt.Load(reader);
        return dt;
    }

    #endregion

    #region 事务

    public void ExecuteTransaction(params SqlCommandInfo[] commands)
    {
        using var conn = CreateConnection();
        using var transaction = conn.BeginTransaction();
        try
        {
            foreach (var cmdInfo in commands)
            {
                using var cmd = new SqlCommand(cmdInfo.Sql, conn, transaction);
                if (cmdInfo.Parameters is { Count: > 0 })
                    cmd.Parameters.AddRange(ConvertToSqlParameters(cmdInfo.Parameters));
                cmd.ExecuteNonQuery();
            }
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task ExecuteTransactionAsync(params SqlCommandInfo[] commands)
    {
        using var conn = await CreateConnectionAsync();
        using var transaction = conn.BeginTransaction();
        try
        {
            foreach (var cmdInfo in commands)
            {
                using var cmd = new SqlCommand(cmdInfo.Sql, conn, transaction);
                if (cmdInfo.Parameters is { Count: > 0 })
                    cmd.Parameters.AddRange(ConvertToSqlParameters(cmdInfo.Parameters));
                await cmd.ExecuteNonQueryAsync();
            }
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    #endregion

    #region 辅助方法

    private static SqlParameter[]? ConvertToSqlParameters(Dictionary<string, object>? parameters)
    {
        if (parameters is not { Count: > 0 }) return null;

        var result = new SqlParameter[parameters.Count];
        int i = 0;
        foreach (var kv in parameters)
        {
            result[i++] = new SqlParameter($"@{kv.Key}", kv.Value ?? DBNull.Value);
        }
        return result;
    }

    public static SqlParameter CreateParameter(string name, object? value)
        => new($"@{name}", value ?? DBNull.Value);

    #endregion
}

public class SqlCommandInfo
{
    public string Sql { get; set; } = string.Empty;
    public Dictionary<string, object>? Parameters { get; set; }
}
