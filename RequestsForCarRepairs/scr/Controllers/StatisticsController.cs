using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Data;

namespace RequestsForCarRepairs.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatisticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        
        [HttpGet]
        public async Task<ActionResult<object>> GetGeneralStatistics()
        {
            var requests = await _context.Requests.ToListAsync();

            var total = requests.Count;
            var inProgress = requests.Count(r => r.RequestStatus.ToLower() == "в работе" || r.RequestStatus.ToLower() == "ожидание");
            var completed = requests.Count(r => r.RequestStatus.ToLower() == "завершена");

            
            double avgTime = 0;
            var completedRequests = requests.Where(r => r.RequestStatus.ToLower() == "завершена" && r.CompletionDate != null);
            if (completedRequests.Any())
            {
                avgTime = completedRequests.Average(r =>
                    (r.CompletionDate.Value - r.StartDate).TotalDays);
            }

            return new
            {
                totalRequests = total,
                inProgress = inProgress,
                completed = completed,
                avgRepairTime = Math.Round(avgTime, 1)
            };
        }

      
        [HttpGet("problems")]
        public async Task<ActionResult<object>> GetProblemStatistics()
        {
            var requests = await _context.Requests.ToListAsync();

            var problemGroups = requests
                .GroupBy(r => GetProblemCategory(r.ProblemDescription ?? "Другое"))
                .Select(g => new
                {
                    problemType = g.Key,
                    count = g.Count(),
                    percentage = Math.Round((double)g.Count() / requests.Count() * 100, 1)
                })
                .OrderByDescending(x => x.count)
                .ToList();

            return Ok(problemGroups);
        }

      
        [HttpGet("master/{masterId}")]
        public async Task<ActionResult<object>> GetMasterStatistics(int masterId)
        {
            var requests = await _context.Requests
                .Where(r => r.MasterID == masterId)
                .ToListAsync();

            var total = requests.Count;
            var completed = requests.Count(r => r.RequestStatus.ToLower() == "завершена");
            var inProgress = requests.Count(r => r.RequestStatus.ToLower() == "в работе");

            return new
            {
                masterId = masterId,
                totalRequests = total,
                completedRequests = completed,
                inProgressRequests = inProgress,
                completionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0
            };
        }

        private string GetProblemCategory(string description)
        {
            description = description.ToLower();

            if (description.Contains("двигатель") || description.Contains("мотор"))
                return "Двигатель";
            if (description.Contains("подвеск") || description.Contains("амортизатор") || description.Contains("стойк"))
                return "Подвеска";
            if (description.Contains("электрик") || description.Contains("провод") || description.Contains("аккумулятор"))
                return "Электрика";
            if (description.Contains("коробк") || description.Contains("акпп") || description.Contains("сцепление"))
                return "Трансмиссия";
            if (description.Contains("тормоз"))
                return "Тормозная система";
            if (description.Contains("шина") || description.Contains("колесо") || description.Contains("резина"))
                return "Шины/Колеса";

            return "Другое";
        }
    }
}