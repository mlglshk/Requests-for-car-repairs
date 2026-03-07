using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Data;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManagerDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ManagerDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ManagerData/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.UserID,
                        u.Fio,
                        u.Phone,
                        u.Login,
                        u.Type
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/ManagerData/requests
        [HttpGet("requests")]
        public async Task<ActionResult<IEnumerable<object>>> GetRequests()
        {
            try
            {
                var requests = await _context.Requests
                    .Select(r => new
                    {
                        r.RequestID,
                        r.StartDate,
                        r.CarType,
                        r.CarModel,
                        r.ProblemDescription,
                        r.RequestStatus,
                        r.CompletionDate,
                        r.RepairParts,
                        r.MasterID,
                        r.ClientID
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/ManagerData/comments
        [HttpGet("comments")]
        public async Task<ActionResult<IEnumerable<object>>> GetComments()
        {
            try
            {
                var comments = await _context.Comments
                    .Select(c => new
                    {
                        c.CommentID,
                        c.Message,
                        c.MasterID,
                        c.RequestID
                    })
                    .ToListAsync();

                return Ok(comments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/ManagerData/mechanics
        [HttpGet("mechanics")]
        public async Task<ActionResult<IEnumerable<object>>> GetMechanics()
        {
            try
            {
                var mechanics = await _context.Users
                    .Where(u => u.Type == "Автомеханик")
                    .Select(u => new
                    {
                        u.UserID,
                        u.Fio,
                        u.Phone
                    })
                    .ToListAsync();

                return Ok(mechanics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}