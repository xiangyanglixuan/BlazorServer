// SqlHelper.cs
using System.Data;
using System.Data.SqlClient;


namespace PlantFactory.Components.Data
{
    public class SqlHelper
    {
        private readonly string _connectionString;

        // 通过构造函数注入连接字符串
        public SqlHelper(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // 或者使用静态方法，从配置获取连接字符串
        public static string GetConnectionString(IConfiguration configuration)
        {
            return configuration.GetConnectionString("DefaultConnection");
        }

        #region 打开数据库连接
        public SqlConnection OpenConnection()
        {
            var conn = new SqlConnection(_connectionString);
            try
            {
                if (conn.State == ConnectionState.Closed)
                {
                    conn.Open();
                }
                else if (conn.State == ConnectionState.Broken)
                {
                    conn.Close();
                    conn.Open();
                }
                return conn;
            }
            catch (Exception ex)
            {
                // 记录日志
                Console.WriteLine($"数据库连接失败: {ex.Message}");
                throw;
            }
        }
        #endregion

        #region 执行查询，返回DataTable
        public DataTable ExecuteQuery(string sql, params SqlParameter[] parameters)
        {
            using (var conn = OpenConnection())
            using (var cmd = new SqlCommand(sql, conn))
            {
                if (parameters != null && parameters.Length > 0)
                {
                    cmd.Parameters.AddRange(parameters);
                }
                
                var dt = new DataTable();
                using (var adapter = new SqlDataAdapter(cmd))
                {
                    adapter.Fill(dt);
                }
                return dt;
            }
        }

        // 重载方法，使用字典参数
        public DataTable ExecuteQuery(string sql, Dictionary<string, object> parameters = null)
        {
            var sqlParameters = ConvertToSqlParameters(parameters);
            return ExecuteQuery(sql, sqlParameters);
        }
        #endregion

        #region 执行非查询操作
        public int ExecuteNonQuery(string sql, params SqlParameter[] parameters)
        {
            using (var conn = OpenConnection())
            using (var cmd = new SqlCommand(sql, conn))
            {
                if (parameters != null && parameters.Length > 0)
                {
                    cmd.Parameters.AddRange(parameters);
                }
                
                return cmd.ExecuteNonQuery();
            }
        }

        public int ExecuteNonQuery(string sql, Dictionary<string, object> parameters = null)
        {
            var sqlParameters = ConvertToSqlParameters(parameters);
            return ExecuteNonQuery(sql, sqlParameters);
        }
        #endregion

        #region 执行标量查询
        public object ExecuteScalar(string sql, params SqlParameter[] parameters)
        {
            using (var conn = OpenConnection())
            using (var cmd = new SqlCommand(sql, conn))
            {
                if (parameters != null && parameters.Length > 0)
                {
                    cmd.Parameters.AddRange(parameters);
                }
                
                return cmd.ExecuteScalar();
            }
        }

        public object ExecuteScalar(string sql, Dictionary<string, object> parameters = null)
        {
            var sqlParameters = ConvertToSqlParameters(parameters);
            return ExecuteScalar(sql, sqlParameters);
        }
        #endregion

        #region 执行存储过程
        public DataTable ExecuteStoredProcedure(string procedureName, params SqlParameter[] parameters)
        {
            using (var conn = OpenConnection())
            using (var cmd = new SqlCommand(procedureName, conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                
                if (parameters != null && parameters.Length > 0)
                {
                    cmd.Parameters.AddRange(parameters);
                }
                
                var dt = new DataTable();
                using (var adapter = new SqlDataAdapter(cmd))
                {
                    adapter.Fill(dt);
                }
                return dt;
            }
        }
        #endregion

        #region 批量操作（使用事务）
        public bool ExecuteTransaction(List<SqlCommandInfo> commands)
        {
            using (var conn = OpenConnection())
            {
                conn.Open();
                using (var transaction = conn.BeginTransaction())
                {
                    try
                    {
                        foreach (var cmdInfo in commands)
                        {
                            using (var cmd = new SqlCommand(cmdInfo.Sql, conn, transaction))
                            {
                                if (cmdInfo.Parameters != null)
                                {
                                    cmd.Parameters.AddRange(ConvertToSqlParameters(cmdInfo.Parameters));
                                }
                                cmd.ExecuteNonQuery();
                            }
                        }
                        transaction.Commit();
                        return true;
                    }
                    catch (Exception)
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
            }
        }
        #endregion

        #region 辅助方法
        private SqlParameter[] ConvertToSqlParameters(Dictionary<string, object> parameters)
        {
            if (parameters == null || parameters.Count == 0)
                return null;

            var sqlParameters = new SqlParameter[parameters.Count];
            int i = 0;
            foreach (var param in parameters)
            {
                sqlParameters[i] = new SqlParameter("@" + param.Key, param.Value ?? DBNull.Value);
                i++;
            }
            return sqlParameters;
        }

        // 参数化查询辅助方法
        public SqlParameter CreateParameter(string name, object value)
        {
            return new SqlParameter("@" + name, value ?? DBNull.Value);
        }
        #endregion
    }

    // 辅助类，用于批量操作
    public class SqlCommandInfo
    {
        public string Sql { get; set; }
        public Dictionary<string, object> Parameters { get; set; }
    }
}