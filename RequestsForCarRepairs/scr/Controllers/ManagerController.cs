using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManagerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ManagerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Manager/requests
        [HttpGet("requests")]
        public async Task<ActionResult<IEnumerable<object>>> GetRequestsForManager()
        {
            try
            {
                var requests = await _context.Requests
                    .Include(r => r.Client)
                    .Include(r => r.Master)
                    .ToListAsync();

                // Создаем анонимные объекты без циклических ссылок
                var result = requests.Select(r => new
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
                    r.ClientID,
                    Client = r.Client == null ? null : new
                    {
                        r.Client.UserID,
                        r.Client.Fio,
                        r.Client.Phone
                    },
                    Master = r.Master == null ? null : new
                    {
                        r.Master.UserID,
                        r.Master.Fio,
                        r.Master.Phone
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/Manager/mechanics
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

        // GET: api/Manager/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            try
            {
                var requests = await _context.Requests.ToListAsync();

                var total = requests.Count;
                var inProgress = requests.Count(r => r.RequestStatus == "В процессе ремонта");
                var ready = requests.Count(r => r.RequestStatus == "Готова к выдаче");
                var new_ = requests.Count(r => r.RequestStatus == "Новая заявка");

                return Ok(new
                {
                    total,
                    inProgress,
                    ready,
                    new_
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/Manager/clients
        [HttpGet("clients")]
        public async Task<ActionResult<IEnumerable<object>>> GetClients()
        {
            try
            {
                var clients = await _context.Users
                    .Where(u => u.Type == "Заказчик")
                    .Select(u => new
                    {
                        u.UserID,
                        u.Fio,
                        u.Phone
                    })
                    .ToListAsync();

                return Ok(clients);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}