using Microsoft.AspNetCore.Mvc;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace RequestsForCarRepairs.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CommentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("request/{requestId}")]
    public async Task<IActionResult> GetCommentsByRequest(int requestId)
    {
        var comments = await _context.Comments
            .Include(c => c.Master)
            .Where(c => c.RequestID == requestId)
            .ToListAsync();

        var commentDtos = comments.Select(c => new CommentDto
        {
            CommentID = c.CommentID,
            Message = c.Message,
            MasterID = c.MasterID,
            RequestID = c.RequestID
        }).ToList();

        return Ok(commentDtos);
    }

    [HttpPost]
    public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto commentDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var request = await _context.Requests.FindAsync(commentDto.RequestID);
        if (request == null)
            return NotFound($"Заявка с ID {commentDto.RequestID} не найдена");

        var master = await _context.Users.FindAsync(commentDto.MasterID);
        if (master == null)
            return NotFound($"Мастер с ID {commentDto.MasterID} не найден");

        var comment = new Comment
        {
            Message = commentDto.Message,
            MasterID = commentDto.MasterID,
            RequestID = commentDto.RequestID
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        return Ok(comment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null)
            return NotFound($"Комментарий с ID {id} не найден");

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}