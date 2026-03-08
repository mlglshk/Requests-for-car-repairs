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

       
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments()
        {
            return await _context.Comments
                .Include(c => c.Master)
                .Include(c => c.Request)
                .ToListAsync();
        }

      
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

        
        [HttpGet("request/{requestId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByRequest(int requestId)
        {
            return await _context.Comments
                .Include(c => c.Master)
                .Where(c => c.RequestID == requestId)
                .OrderByDescending(c => c.CommentID)
                .ToListAsync();
        }


        [HttpGet("master/{masterId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByMaster(int masterId)
        {
            return await _context.Comments
                .Include(c => c.Request)
                .Where(c => c.MasterID == masterId)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Comment>> PostComment(Comment comment)
        {
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComment), new { id = comment.CommentID }, comment);
        }

 
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

    public class AddCommentRequest
    {
        public int MasterID { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}