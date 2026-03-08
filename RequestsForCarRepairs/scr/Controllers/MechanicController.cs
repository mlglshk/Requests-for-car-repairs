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

      
        [HttpGet("requests/{mechanicId}")]
        public async Task<ActionResult<IEnumerable<Request>>> GetMechanicRequests(int mechanicId, [FromQuery] string? status)
        {
            var query = _context.Requests
                .Include(r => r.Client)
                .Include(r => r.Comments)
                    .ThenInclude(c => c.Master)
                .Where(r => r.MasterID == mechanicId); 

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.RequestStatus == status); 
            }

            return await query.ToListAsync();
        }

        
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<Request>>> GetAvailableRequests()
        {
            var requests = await _context.Requests
                .Include(r => r.Client)
                .Where(r => r.MasterID == null && r.RequestStatus == "новая") 
                .ToListAsync();

            return Ok(requests);
        }

      
        [HttpPut("take/{requestId}")]
        public async Task<IActionResult> TakeRequest(int requestId, [FromBody] TakeRequestModel model)
        {
            var request = await _context.Requests.FindAsync(requestId);
            if (request == null)
            {
                return NotFound();
            }

            request.MasterID = model.MechanicId;
            request.RequestStatus = "в работе"; 

            await _context.SaveChangesAsync();
            return Ok(request);
        }

       
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
                request.CompletionDate = DateTime.Now; 
            }

            if (!string.IsNullOrEmpty(model.RepairParts))
            {
                request.RepairParts = model.RepairParts; 
            }

            await _context.SaveChangesAsync();
            return Ok(request);
        }

      
        [HttpGet("comments/{requestId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments(int requestId)
        {
            var comments = await _context.Comments
                .Where(c => c.RequestID == requestId)
                .Include(c => c.Master)
                .OrderByDescending(c => c.CommentID)
                .ToListAsync();

            
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