using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MechanicController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MechanicController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/mechanic/requests/5?status=в работе
        [HttpGet("requests/{mechanicId}")]
        public async Task<ActionResult<IEnumerable<Request>>> GetMechanicRequests(int mechanicId, [FromQuery] string? status)
        {
            var query = _context.Requests
                .Include(r => r.Client)
                .Include(r => r.Comments)
                    .ThenInclude(c => c.Master)
                .Where(r => r.MasterID == mechanicId); // Используем MasterID

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.RequestStatus == status); // Используем RequestStatus
            }

            return await query.ToListAsync();
        }

        // GET: api/mechanic/available
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<Request>>> GetAvailableRequests()
        {
            var requests = await _context.Requests
                .Include(r => r.Client)
                .Where(r => r.MasterID == null && r.RequestStatus == "новая") // Свободные заявки
                .ToListAsync();

            return Ok(requests);
        }

        // PUT: api/mechanic/take/5
        [HttpPut("take/{requestId}")]
        public async Task<IActionResult> TakeRequest(int requestId, [FromBody] TakeRequestModel model)
        {
            var request = await _context.Requests.FindAsync(requestId);
            if (request == null)
            {
                return NotFound();
            }

            request.MasterID = model.MechanicId;
            request.RequestStatus = "в работе"; // Меняем статус

            await _context.SaveChangesAsync();
            return Ok(request);
        }

        // PUT: api/mechanic/status/5
        [HttpPut("status/{requestId}")]
        public async Task<IActionResult> UpdateStatus(int requestId, [FromBody] UpdateStatusModel model)
        {
            var request = await _context.Requests.FindAsync(requestId);
            if (request == null)
            {
                return NotFound();
            }

            request.RequestStatus = model.Status;

            if (model.Status == "завершена")
            {
                request.CompletionDate = DateTime.Now; // Устанавливаем дату завершения
            }

            if (!string.IsNullOrEmpty(model.RepairParts))
            {
                request.RepairParts = model.RepairParts; // Запчасти если есть
            }

            await _context.SaveChangesAsync();
            return Ok(request);
        }

        // GET: api/mechanic/comments/5
        [HttpGet("comments/{requestId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments(int requestId)
        {
            var comments = await _context.Comments
                .Where(c => c.RequestID == requestId)
                .Include(c => c.Master)
                .OrderByDescending(c => c.CommentID)
                .ToListAsync();

            // Преобразуем для отправки на клиент
            var result = comments.Select(c => new
            {
                c.CommentID,
                c.Message,
                c.MasterID,
                AuthorName = c.Master?.Fio ?? "Механик",
                c.RequestID
            });

            return Ok(result);
        }

        // POST: api/mechanic/comments/5
        [HttpPost("comments/{requestId}")]
        public async Task<ActionResult<Comment>> AddComment(int requestId, [FromBody] AddCommentModel model)
        {
            var comment = new Comment
            {
                RequestID = requestId,
                MasterID = model.MasterID,
                Message = model.Message
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Загружаем данные мастера для ответа
            await _context.Entry(comment)
                .Reference(c => c.Master)
                .LoadAsync();

            var result = new
            {
                comment.CommentID,
                comment.Message,
                comment.MasterID,
                AuthorName = comment.Master?.Fio ?? "Механик",
                comment.RequestID
            };

            return Ok(result);
        }

        // GET: api/mechanic/completed/5
        [HttpGet("completed/{mechanicId}")]
        public async Task<ActionResult<IEnumerable<Request>>> GetCompletedRequests(int mechanicId)
        {
            var requests = await _context.Requests
                .Include(r => r.Client)
                .Where(r => r.MasterID == mechanicId && r.RequestStatus == "завершена")
                .OrderByDescending(r => r.CompletionDate)
                .ToListAsync();

            return Ok(requests);
        }
    }

    // Модели для запросов
    public class TakeRequestModel
    {
        public int MechanicId { get; set; }
    }

    public class UpdateStatusModel
    {
        public string Status { get; set; } = "";
        public string? RepairParts { get; set; }
    }

    public class AddCommentModel
    {
        public int MasterID { get; set; }
        public string Message { get; set; } = "";
    }
}