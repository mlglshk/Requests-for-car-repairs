using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.DTOs;

namespace RequestsForCarRepairs.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel loginModel)
    {
        if (loginModel == null || string.IsNullOrEmpty(loginModel.Login) || string.IsNullOrEmpty(loginModel.Password))
        {
            return BadRequest(new { message = "Логин и пароль обязательны" });
        }

        // Простая проверка логина и пароля из БД
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Login == loginModel.Login && u.Password == loginModel.Password);

        if (user == null)
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        // Возвращаем данные пользователя
        var response = new
        {
            user.UserID,
            user.Fio,
            user.Type,
            message = "Вход выполнен успешно"
        };

        return Ok(response);
    }
}