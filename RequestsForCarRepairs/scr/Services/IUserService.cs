using RequestsForCarRepairs.API.Models;

namespace RequestsForCarRepairs.API.Services
{
    public interface IUserService
    {
        Task<User?> AuthenticateAsync(string login, string password);
        Task<User?> GetUserByIdAsync(int userId);
        Task<List<User>> GetAllUsersAsync();
    }
}