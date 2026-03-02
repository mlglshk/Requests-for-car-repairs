using Microsoft.AspNetCore.Mvc;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace RequestsForCarRepairs.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users.ToListAsync();

        var userDtos = users.Select(u => new UserDto
        {
            UserID = u.UserID,
            Fio = u.Fio,
            Phone = u.Phone,
            Login = u.Login,
            Type = u.Type
        }).ToList();

        return Ok(userDtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound($"Пользователь с ID {id} не найден");

        var userDto = new UserDto
        {
            UserID = user.UserID,
            Fio = user.Fio,
            Phone = user.Phone,
            Login = user.Login,
            Type = user.Type
        };

        return Ok(userDto);
    }

    [HttpGet("type/{type}")]
    public async Task<IActionResult> GetUsersByType(string type)
    {
        var users = await _context.Users
            .Where(u => u.Type == type)
            .ToListAsync();

        var userDtos = users.Select(u => new UserDto
        {
            UserID = u.UserID,
            Fio = u.Fio,
            Phone = u.Phone,
            Login = u.Login,
            Type = u.Type
        }).ToList();

        return Ok(userDtos);
    }
}