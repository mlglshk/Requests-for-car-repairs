using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.Data;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Comments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments()
        {
            return await _context.Comments
                .Include(c => c.Master)
                .Include(c => c.Request)
                .ToListAsync();
        }

        // GET: api/Comments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Comment>> GetComment(int id)
        {
            var comment = await _context.Comments
                .Include(c => c.Master)
                .Include(c => c.Request)
                .FirstOrDefaultAsync(c => c.CommentID == id);

            if (comment == null)
            {
                return NotFound();
            }

            return comment;
        }

        // GET: api/Comments/request/5
        [HttpGet("request/{requestId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByRequest(int requestId)
        {
            return await _context.Comments
                .Include(c => c.Master)
                .Where(c => c.RequestID == requestId)
                .OrderByDescending(c => c.CommentID)
                .ToListAsync();
        }

        // GET: api/Comments/master/5
        [HttpGet("master/{masterId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByMaster(int masterId)
        {
            return await _context.Comments
                .Include(c => c.Request)
                .Where(c => c.MasterID == masterId)
                .ToListAsync();
        }

        // POST: api/Comments
        [HttpPost]
        public async Task<ActionResult<Comment>> PostComment(Comment comment)
        {
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComment), new { id = comment.CommentID }, comment);
        }

        // POST: api/Comments/request/5
        [HttpPost("request/{requestId}")]
        public async Task<ActionResult<Comment>> AddCommentToRequest(int requestId, [FromBody] AddCommentRequest request)
        {
            var comment = new Comment
            {
                RequestID = requestId,
                MasterID = request.MasterID,
                Message = request.Message
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComment), new { id = comment.CommentID }, comment);
        }

        // PUT: api/Comments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutComment(int id, Comment comment)
        {
            if (id != comment.CommentID)
            {
                return BadRequest();
            }

            _context.Entry(comment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CommentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Comments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CommentExists(int id)
        {
            return _context.Comments.Any(e => e.CommentID == id);
        }
    }

    // Модель для добавления комментария - вынесена за пределы класса контроллера
    // и названа по-другому, чтобы избежать конфликта имен
    public class AddCommentRequest
    {
        public int MasterID { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}