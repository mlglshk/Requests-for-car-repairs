using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RequestsForCarRepairs.API.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(ApplicationDbContext context, ILogger<UserService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<User?> AuthenticateAsync(string login, string password)
        {
            try
            {
                _logger.LogInformation($"Поиск пользователя: {login}");

                if (_context == null)
                {
                    _logger.LogError("Контекст базы данных не инициализирован");
                    return null;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Login == login && u.Password == password);

                if (user == null)
                {
                    _logger.LogWarning($"Пользователь не найден: {login}");
                }
                else
                {
                    _logger.LogInformation($"Пользователь найден: {user.Login}, роль: {user.Type}");
                }

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при аутентификации пользователя {login}: {ex.Message}");
                throw; // Пробрасываем исключение для обработки в контроллере
            }
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            try
            {
                return await _context.Users
                    .Include(u => u.ClientRequests)
                    .Include(u => u.MasterRequests)
                    .Include(u => u.Comments)
                    .FirstOrDefaultAsync(u => u.UserID == userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении пользователя {userId}: {ex.Message}");
                throw;
            }
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            try
            {
                return await _context.Users.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении всех пользователей: {ex.Message}");
                throw;
            }
        }
    }
}