using Microsoft.AspNetCore.Mvc;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserService userService, ILogger<AuthController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                _logger.LogInformation($"Попытка входа: {model?.Login}");

                
                if (model == null)
                {
                    _logger.LogWarning("Модель логина пустая");
                    return BadRequest(new { error = "Некорректные данные запроса" });
                }

                if (string.IsNullOrEmpty(model.Login) || string.IsNullOrEmpty(model.Password))
                {
                    _logger.LogWarning("Логин или пароль пустые");
                    return BadRequest(new { error = "Логин и пароль обязательны" });
                }

                if (_userService == null)
                {
                    _logger.LogError("UserService не инициализирован");
                    return StatusCode(500, new { error = "Ошибка конфигурации сервера" });
                }

                _logger.LogInformation($"Вызов AuthenticateAsync для пользователя: {model.Login}");

                var user = await _userService.AuthenticateAsync(model.Login, model.Password);

                if (user == null)
                {
                    _logger.LogWarning($"Неудачная попытка входа для логина: {model.Login}");
                    return Unauthorized(new { error = "Неверный логин или пароль" });
                }

                _logger.LogInformation($"Успешный вход: {user.Login}, роль: {user.Type}");

                
                var userData = new
                {
                    user.UserID,
                    user.Fio,
                    user.Phone,
                    user.Login,
                    user.Type
                };

                return Ok(userData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при авторизации: {ex.Message}");

                
                if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    return StatusCode(500, new
                    {
                        error = "Внутренняя ошибка сервера",
                        details = ex.Message,
                        stackTrace = ex.StackTrace
                    });
                }

                return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
            }
        }
    }
}